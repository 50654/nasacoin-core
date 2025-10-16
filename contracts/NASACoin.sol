// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NASA Coin (NASAPEPE) - ERC-20 Token
 * @dev High-reward experimental cryptocurrency with limited supply
 * @author NASA Coin Team
 */
contract NASACoin is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Token constants
    uint256 public constant MAX_SUPPLY = 5_000_000 * 10**18; // 5 million tokens
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million initial
    uint256 public constant BLOCK_REWARD = 500_000 * 10**18; // 500k per block
    
    // Mining and staking
    mapping(address => uint256) public lastMiningTime;
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingStartTime;
    mapping(address => uint256) public stakingRewards;
    
    // Mining parameters
    uint256 public miningDifficulty = 1000;
    uint256 public miningCooldown = 10 minutes;
    uint256 public stakingAPY = 1000; // 10% APY (basis points)
    
    // Events
    event TokensMined(address indexed miner, uint256 amount, uint256 difficulty);
    event TokensStaked(address indexed staker, uint256 amount);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 rewards);
    event RewardsDistributed(address indexed recipient, uint256 amount);
    event DifficultyAdjusted(uint256 oldDifficulty, uint256 newDifficulty);
    
    constructor() ERC20("NASA Coin", "NASAPEPE") {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Transfer ownership to deployer
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Mine new tokens (simplified proof-of-work simulation)
     * @param nonce Random number for mining attempt
     */
    function mine(uint256 nonce) external nonReentrant whenNotPaused {
        require(block.timestamp >= lastMiningTime[msg.sender] + miningCooldown, "Mining cooldown active");
        require(totalSupply() + BLOCK_REWARD <= MAX_SUPPLY, "Max supply reached");
        
        // Simple hash-based mining simulation
        bytes32 hash = keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            nonce
        ));
        
        uint256 hashValue = uint256(hash);
        require(hashValue % miningDifficulty == 0, "Mining attempt failed");
        
        // Successful mining
        lastMiningTime[msg.sender] = block.timestamp;
        _mint(msg.sender, BLOCK_REWARD);
        
        // Adjust difficulty every 100 blocks
        if (totalSupply() % (BLOCK_REWARD * 100) == 0) {
            _adjustDifficulty();
        }
        
        emit TokensMined(msg.sender, BLOCK_REWARD, miningDifficulty);
    }
    
    /**
     * @dev Stake tokens to earn rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim existing rewards first
        if (stakingBalance[msg.sender] > 0) {
            _claimStakingRewards();
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking info
        stakingBalance[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingBalance[msg.sender] >= amount, "Insufficient staking balance");
        
        // Calculate and claim rewards
        uint256 rewards = _claimStakingRewards();
        
        // Update staking balance
        stakingBalance[msg.sender] -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount, rewards);
    }
    
    /**
     * @dev Claim staking rewards without unstaking
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 rewards = _claimStakingRewards();
        require(rewards > 0, "No rewards to claim");
    }
    
    /**
     * @dev Internal function to calculate and distribute staking rewards
     */
    function _claimStakingRewards() internal returns (uint256) {
        if (stakingBalance[msg.sender] == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stakingStartTime[msg.sender];
        uint256 rewards = (stakingBalance[msg.sender] * stakingAPY * stakingDuration) / (365 days * 10000);
        
        if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(msg.sender, rewards);
            stakingRewards[msg.sender] += rewards;
            stakingStartTime[msg.sender] = block.timestamp;
            
            emit RewardsDistributed(msg.sender, rewards);
        }
        
        return rewards;
    }
    
    /**
     * @dev Adjust mining difficulty based on network activity
     */
    function _adjustDifficulty() internal {
        uint256 oldDifficulty = miningDifficulty;
        
        // Simple difficulty adjustment (increase by 10%)
        miningDifficulty = (miningDifficulty * 110) / 100;
        
        // Cap difficulty
        if (miningDifficulty > 10000) {
            miningDifficulty = 10000;
        }
        
        emit DifficultyAdjusted(oldDifficulty, miningDifficulty);
    }
    
    /**
     * @dev Get staking info for an address
     */
    function getStakingInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 stakingTime,
        uint256 pendingRewards,
        uint256 totalRewards
    ) {
        stakedAmount = stakingBalance[account];
        stakingTime = stakingStartTime[account];
        totalRewards = stakingRewards[account];
        
        if (stakedAmount > 0) {
            uint256 stakingDuration = block.timestamp - stakingTime;
            pendingRewards = (stakedAmount * stakingAPY * stakingDuration) / (365 days * 10000);
        }
    }
    
    /**
     * @dev Get mining info for an address
     */
    function getMiningInfo(address account) external view returns (
        uint256 lastMining,
        uint256 nextMiningTime,
        uint256 currentDifficulty,
        bool canMine
    ) {
        lastMining = lastMiningTime[account];
        nextMiningTime = lastMining + miningCooldown;
        currentDifficulty = miningDifficulty;
        canMine = block.timestamp >= nextMiningTime && totalSupply() + BLOCK_REWARD <= MAX_SUPPLY;
    }
    
    /**
     * @dev Owner functions for contract management
     */
    function setMiningCooldown(uint256 _cooldown) external onlyOwner {
        miningCooldown = _cooldown;
    }
    
    function setStakingAPY(uint256 _apy) external onlyOwner {
        require(_apy <= 5000, "APY too high"); // Max 50%
        stakingAPY = _apy;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}