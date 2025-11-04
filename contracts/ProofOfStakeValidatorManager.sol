// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ProofOfStakeValidatorManager
 * @notice Manages validator registration and staking for the NASA Coin ecosystem
 * @dev Validators stake NASACoin tokens to participate in consensus. The manager
 *      keeps track of validator states, staking balances, reward distribution,
 *      and slashing events. Tokens deposited as stake or rewards are held in this
 *      contract until claimed or withdrawn through the appropriate flows.
 */
contract ProofOfStakeValidatorManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Possible validator lifecycle states
    enum ValidatorStatus {
        None,
        Active,
        Exiting,
        Slashed
    }

    /// @dev Metadata tracked for each validator
    struct Validator {
        uint256 stakedAmount;
        uint256 pendingRewards;
        uint256 activationTime;
        uint256 exitAllowedAfter;
        ValidatorStatus status;
    }

    IERC20 public immutable stakingToken;

    uint256 public minStake;
    uint256 public lockupPeriod;
    uint256 public maxValidators;

    uint256 public activeValidatorCount;
    uint256 public totalActiveStake;
    uint256 public totalPendingRewards;

    mapping(address => Validator) private validators;
    mapping(address => bool) private isListed;
    address[] private validatorIndex;

    event ValidatorRegistered(address indexed validator, uint256 amount, uint256 activationTime);
    event ValidatorStakeIncreased(address indexed validator, uint256 additionalStake, uint256 newTotalStake);
    event ValidatorExitRequested(address indexed validator, uint256 exitAllowedAfter);
    event ValidatorExitCancelled(address indexed validator);
    event ValidatorExitCompleted(address indexed validator, uint256 returnedStake, uint256 paidRewards);
    event ValidatorSlashed(address indexed validator, uint256 penaltyAmount, address indexed recipient);
    event RewardsAllocated(address indexed validator, uint256 amount);
    event RewardsClaimed(address indexed validator, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);
    event MinStakeUpdated(uint256 newMinStake);
    event LockupPeriodUpdated(uint256 newLockupPeriod);
    event MaxValidatorsUpdated(uint256 newMaxValidators);

    error AlreadyValidator();
    error MaxValidatorsReached();
    error InvalidStakeAmount();
    error ValidatorNotActive();
    error ValidatorNotFound();
    error ExitNotRequested();
    error LockupPeriodNotElapsed();
    error NothingToClaim();
    error InsufficientRewardLiquidity();
    error ValidatorNotSlashable();
    error InvalidConfiguration();

    /**
     * @notice Create a new validator manager
     * @param _stakingToken NASACoin token address used for staking
     * @param _minStake Minimum stake required to become a validator
     * @param _lockupPeriod Minimum time a validator must wait after requesting exit
     * @param _maxValidators Maximum number of simultaneous active validators
     */
    constructor(
        IERC20 _stakingToken,
        uint256 _minStake,
        uint256 _lockupPeriod,
        uint256 _maxValidators
    ) {
        if (address(_stakingToken) == address(0) || _minStake == 0 || _maxValidators == 0) {
            revert InvalidConfiguration();
        }

        stakingToken = _stakingToken;
        minStake = _minStake;
        lockupPeriod = _lockupPeriod;
        maxValidators = _maxValidators;
    }

    // =============================================================
    // Validator lifecycle
    // =============================================================

    /**
     * @notice Become a validator by depositing the required stake amount
     * @param amount Amount of NASACoin tokens to stake (must be >= minStake)
     */
    function registerValidator(uint256 amount) external nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.None) {
            revert AlreadyValidator();
        }
        if (amount < minStake) {
            revert InvalidStakeAmount();
        }
        if (activeValidatorCount >= maxValidators) {
            revert MaxValidatorsReached();
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        validator.stakedAmount = amount;
        validator.pendingRewards = 0;
        validator.activationTime = block.timestamp;
        validator.exitAllowedAfter = 0;
        validator.status = ValidatorStatus.Active;

        activeValidatorCount += 1;
        totalActiveStake += amount;

        if (!isListed[msg.sender]) {
            isListed[msg.sender] = true;
            validatorIndex.push(msg.sender);
        }

        emit ValidatorRegistered(msg.sender, amount, validator.activationTime);
    }

    /**
     * @notice Increase the staked balance for the calling validator
     * @param amount Additional stake to deposit
     */
    function increaseStake(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidStakeAmount();
        }

        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.Active) {
            revert ValidatorNotActive();
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        validator.stakedAmount += amount;
        totalActiveStake += amount;

        emit ValidatorStakeIncreased(msg.sender, amount, validator.stakedAmount);
    }

    /**
     * @notice Request to exit the validator set. Exiting validators must wait for the lockup period.
     */
    function requestExit() external {
        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.Active) {
            revert ValidatorNotActive();
        }

        validator.status = ValidatorStatus.Exiting;
        validator.exitAllowedAfter = block.timestamp + lockupPeriod;

        emit ValidatorExitRequested(msg.sender, validator.exitAllowedAfter);
    }

    /**
     * @notice Cancel a pending exit request and return to the active validator set.
     */
    function cancelExit() external {
        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.Exiting) {
            revert ExitNotRequested();
        }

        validator.status = ValidatorStatus.Active;
        validator.exitAllowedAfter = 0;

        emit ValidatorExitCancelled(msg.sender);
    }

    /**
     * @notice Complete the exit process and withdraw stake and pending rewards.
     */
    function completeExit() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.Exiting) {
            revert ExitNotRequested();
        }
        if (block.timestamp < validator.exitAllowedAfter) {
            revert LockupPeriodNotElapsed();
        }

        uint256 stakeAmount = validator.stakedAmount;
        uint256 rewardAmount = validator.pendingRewards;

        totalActiveStake -= stakeAmount;
        activeValidatorCount -= 1;

        if (rewardAmount > 0) {
            totalPendingRewards -= rewardAmount;
        }

        validator.stakedAmount = 0;
        validator.pendingRewards = 0;
        validator.activationTime = 0;
        validator.exitAllowedAfter = 0;
        validator.status = ValidatorStatus.None;

        stakingToken.safeTransfer(msg.sender, stakeAmount + rewardAmount);

        emit ValidatorExitCompleted(msg.sender, stakeAmount, rewardAmount);
    }

    /**
     * @notice Claim pending rewards while remaining an active validator.
     */
    function claimRewards() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (validator.status != ValidatorStatus.Active) {
            revert ValidatorNotActive();
        }

        uint256 rewards = validator.pendingRewards;
        if (rewards == 0) {
            revert NothingToClaim();
        }

        validator.pendingRewards = 0;
        totalPendingRewards -= rewards;

        stakingToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    // =============================================================
    // Reward funding & allocation
    // =============================================================

    /**
     * @notice Deposit tokens into the reward pool for validator incentives.
     * @param amount Amount of NASACoin tokens to deposit
     */
    function fundRewards(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidStakeAmount();
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit RewardsFunded(msg.sender, amount);
    }

    /**
     * @notice Allocate rewards to a specific validator. The rewards remain pending until claimed or exited.
     * @param validatorAddress Validator receiving the reward allocation
     * @param amount Amount of NASACoin tokens to allocate
     */
    function allocateRewards(address validatorAddress, uint256 amount) external onlyOwner {
        if (amount == 0) {
            revert InvalidStakeAmount();
        }

        Validator storage validator = validators[validatorAddress];
        if (validator.status != ValidatorStatus.Active && validator.status != ValidatorStatus.Exiting) {
            revert ValidatorNotFound();
        }

        uint256 availableRewards = rewardPoolBalance();
        if (availableRewards < amount) {
            revert InsufficientRewardLiquidity();
        }

        validator.pendingRewards += amount;
        totalPendingRewards += amount;

        emit RewardsAllocated(validatorAddress, amount);
    }

    /**
     * @notice Withdraw excess reward tokens from the contract balance.
     * @param recipient Address receiving the withdrawn tokens
     * @param amount Amount of tokens to withdraw from the reward pool
     */
    function withdrawExcessRewards(address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (recipient == address(0) || amount == 0) {
            revert InvalidStakeAmount();
        }

        uint256 availableRewards = rewardPoolBalance();
        if (availableRewards < amount) {
            revert InsufficientRewardLiquidity();
        }

        stakingToken.safeTransfer(recipient, amount);
    }

    // =============================================================
    // Slashing
    // =============================================================

    /**
     * @notice Slash a validator's stake for misbehaviour.
     * @param validatorAddress Address of the validator being slashed
     * @param amount Penalty amount to deduct from the validator's stake
     * @param recipient Optional address to receive the slashed stake (address(0) retains in pool)
     */
    function slashValidator(address validatorAddress, uint256 amount, address recipient) external onlyOwner nonReentrant {
        if (amount == 0) {
            revert InvalidStakeAmount();
        }

        Validator storage validator = validators[validatorAddress];
        if (validator.status != ValidatorStatus.Active && validator.status != ValidatorStatus.Exiting) {
            revert ValidatorNotSlashable();
        }

        uint256 penalty = amount > validator.stakedAmount ? validator.stakedAmount : amount;

        validator.stakedAmount -= penalty;
        totalActiveStake -= penalty;

        if (validator.stakedAmount == 0) {
            activeValidatorCount -= 1;

            if (validator.pendingRewards > 0) {
                totalPendingRewards -= validator.pendingRewards;
                validator.pendingRewards = 0;
            }

            validator.status = ValidatorStatus.Slashed;
            validator.exitAllowedAfter = 0;
            validator.activationTime = 0;
        }

        if (recipient != address(0)) {
            stakingToken.safeTransfer(recipient, penalty);
        }

        emit ValidatorSlashed(validatorAddress, penalty, recipient);
    }

    // =============================================================
    // Configuration management
    // =============================================================

    /**
     * @notice Update the minimum stake required for validators.
     * @param newMinStake New minimum stake amount
     */
    function setMinStake(uint256 newMinStake) external onlyOwner {
        if (newMinStake == 0) {
            revert InvalidConfiguration();
        }
        minStake = newMinStake;
        emit MinStakeUpdated(newMinStake);
    }

    /**
     * @notice Update the lockup period applied when validators request exit.
     * @param newLockupPeriod New lockup duration in seconds
     */
    function setLockupPeriod(uint256 newLockupPeriod) external onlyOwner {
        lockupPeriod = newLockupPeriod;
        emit LockupPeriodUpdated(newLockupPeriod);
    }

    /**
     * @notice Update the maximum allowed number of active validators.
     * @param newMaxValidators New maximum validator count
     */
    function setMaxValidators(uint256 newMaxValidators) external onlyOwner {
        if (newMaxValidators == 0 || newMaxValidators < activeValidatorCount) {
            revert InvalidConfiguration();
        }
        maxValidators = newMaxValidators;
        emit MaxValidatorsUpdated(newMaxValidators);
    }

    // =============================================================
    // View helpers
    // =============================================================

    /**
     * @notice Return validator information
     * @param validatorAddress Validator to query
     */
    function getValidator(address validatorAddress)
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingRewards,
            uint256 activationTime,
            uint256 exitAllowedAfter,
            ValidatorStatus status
        )
    {
        Validator storage validator = validators[validatorAddress];
        return (
            validator.stakedAmount,
            validator.pendingRewards,
            validator.activationTime,
            validator.exitAllowedAfter,
            validator.status
        );
    }

    /**
     * @notice Returns whether an address is part of the validator set (any state other than None)
     * @param validatorAddress Address to check
     */
    function isValidatorActive(address validatorAddress) external view returns (bool) {
        ValidatorStatus status = validators[validatorAddress].status;
        return status == ValidatorStatus.Active || status == ValidatorStatus.Exiting;
    }

    /**
     * @notice Get the list of validator addresses ever registered
     */
    function getValidatorAddresses() external view returns (address[] memory) {
        return validatorIndex;
    }

    /**
     * @notice Compute the available reward balance not currently committed to stakes or pending rewards
     */
    function rewardPoolBalance() public view returns (uint256) {
        uint256 contractBalance = stakingToken.balanceOf(address(this));
        uint256 reserved = totalActiveStake + totalPendingRewards;
        if (contractBalance <= reserved) {
            return 0;
        }
        return contractBalance - reserved;
    }
}

