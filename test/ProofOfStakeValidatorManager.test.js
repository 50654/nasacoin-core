const { expect } = require("chai");

describe("ProofOfStakeValidatorManager", function () {
  const MIN_STAKE = ethers.parseEther("1000");
  const LOCKUP_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const MAX_VALIDATORS = 5;

  let owner;
  let validator1;
  let validator2;
  let nasaCoin;
  let validatorManager;

  beforeEach(async function () {
    [owner, validator1, validator2] = await ethers.getSigners();

    const NASACoin = await ethers.getContractFactory("NASACoin");
    nasaCoin = await NASACoin.deploy();
    await nasaCoin.waitForDeployment();

    const ProofOfStakeValidatorManager = await ethers.getContractFactory("ProofOfStakeValidatorManager");
    validatorManager = await ProofOfStakeValidatorManager.deploy(
      await nasaCoin.getAddress(),
      MIN_STAKE,
      LOCKUP_PERIOD,
      MAX_VALIDATORS
    );
    await validatorManager.waitForDeployment();

    // Fund validators with NASACoin for staking
    await nasaCoin.transfer(validator1.address, ethers.parseEther("5000"));
    await nasaCoin.transfer(validator2.address, ethers.parseEther("5000"));
  });

  async function registerValidator(signer, amount = MIN_STAKE) {
    await nasaCoin.connect(signer).approve(await validatorManager.getAddress(), amount);
    await validatorManager.connect(signer).registerValidator(amount);
  }

  describe("registration", function () {
    it("allows a validator to register with sufficient stake", async function () {
      await registerValidator(validator1);

      const [stakedAmount,,, , status] = await validatorManager.getValidator(validator1.address);
      expect(stakedAmount).to.equal(MIN_STAKE);
      expect(status).to.equal(1); // Active
      expect(await validatorManager.activeValidatorCount()).to.equal(1);
      expect(await validatorManager.totalActiveStake()).to.equal(MIN_STAKE);
    });

    it("reverts if stake is below minimum", async function () {
      const insufficientStake = ethers.parseEther("999");
      await nasaCoin.connect(validator1).approve(await validatorManager.getAddress(), insufficientStake);
      await expect(
        validatorManager.connect(validator1).registerValidator(insufficientStake)
      ).to.be.revertedWithCustomError(validatorManager, "InvalidStakeAmount");
    });

    it("enforces the maximum number of validators", async function () {
      await validatorManager.setMaxValidators(1);

      await registerValidator(validator1);

      await nasaCoin.connect(validator2).approve(await validatorManager.getAddress(), MIN_STAKE);
      await expect(
        validatorManager.connect(validator2).registerValidator(MIN_STAKE)
      ).to.be.revertedWithCustomError(validatorManager, "MaxValidatorsReached");
    });
  });

  describe("staking lifecycle", function () {
    beforeEach(async function () {
      await registerValidator(validator1);
    });

    it("allows increasing stake", async function () {
      const additionalStake = ethers.parseEther("250");
      await nasaCoin.connect(validator1).approve(await validatorManager.getAddress(), additionalStake);

      await validatorManager.connect(validator1).increaseStake(additionalStake);

      const [updatedStake] = await validatorManager.getValidator(validator1.address);
      expect(updatedStake).to.equal(MIN_STAKE + additionalStake);
      expect(await validatorManager.totalActiveStake()).to.equal(MIN_STAKE + additionalStake);
    });

    it("supports requesting and cancelling exit", async function () {
      await validatorManager.connect(validator1).requestExit();

      let [,,, exitAllowedAfter, status] = await validatorManager.getValidator(validator1.address);
      expect(status).to.equal(2); // Exiting
      expect(exitAllowedAfter).to.be.gt(0); // exitAllowedAfter set

      await validatorManager.connect(validator1).cancelExit();

      [,,, exitAllowedAfter, status] = await validatorManager.getValidator(validator1.address);
      expect(status).to.equal(1); // Active again
      expect(exitAllowedAfter).to.equal(0); // exitAllowedAfter reset
    });

    it("blocks exit completion before lockup and succeeds after", async function () {
      const balanceBefore = await nasaCoin.balanceOf(validator1.address);

      await validatorManager.connect(validator1).requestExit();

      await expect(
        validatorManager.connect(validator1).completeExit()
      ).to.be.revertedWithCustomError(validatorManager, "LockupPeriodNotElapsed");

      await ethers.provider.send("evm_increaseTime", [LOCKUP_PERIOD]);
      await ethers.provider.send("evm_mine");

      await validatorManager.connect(validator1).completeExit();

      const balanceAfter = await nasaCoin.balanceOf(validator1.address);
      expect(balanceAfter).to.equal(balanceBefore + MIN_STAKE);
      expect(await validatorManager.activeValidatorCount()).to.equal(0);
      expect(await validatorManager.totalActiveStake()).to.equal(0);
    });
  });

  describe("rewards", function () {
    beforeEach(async function () {
      await registerValidator(validator1);
    });

    it("allows funding, allocation, and claiming rewards", async function () {
      const rewardAmount = ethers.parseEther("500");

      await nasaCoin.approve(await validatorManager.getAddress(), rewardAmount);
      await validatorManager.fundRewards(rewardAmount);

      expect(await validatorManager.rewardPoolBalance()).to.equal(rewardAmount);

      await validatorManager.allocateRewards(validator1.address, rewardAmount);

      let [, pendingRewards] = await validatorManager.getValidator(validator1.address);
      expect(pendingRewards).to.equal(rewardAmount);
      expect(await validatorManager.rewardPoolBalance()).to.equal(0);

      const balanceBefore = await nasaCoin.balanceOf(validator1.address);
      await validatorManager.connect(validator1).claimRewards();

      const balanceAfter = await nasaCoin.balanceOf(validator1.address);
      expect(balanceAfter).to.equal(balanceBefore + rewardAmount);

      [, pendingRewards] = await validatorManager.getValidator(validator1.address);
      expect(pendingRewards).to.equal(0);
    });

    it("prevents reward allocation if liquidity is insufficient", async function () {
      const rewardAmount = ethers.parseEther("100");

      await expect(
        validatorManager.allocateRewards(validator1.address, rewardAmount)
      ).to.be.revertedWithCustomError(validatorManager, "InsufficientRewardLiquidity");
    });
  });

  describe("slashing", function () {
    beforeEach(async function () {
      await registerValidator(validator1);
    });

    it("reduces stake and transfers to recipient on slash", async function () {
      const penalty = ethers.parseEther("200");

      const ownerBalanceBefore = await nasaCoin.balanceOf(owner.address);

      await validatorManager.slashValidator(validator1.address, penalty, owner.address);

      const [remainingStake] = await validatorManager.getValidator(validator1.address);
      expect(remainingStake).to.equal(MIN_STAKE - penalty);
      expect(await validatorManager.totalActiveStake()).to.equal(MIN_STAKE - penalty);

      const ownerBalanceAfter = await nasaCoin.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + penalty);
    });

    it("marks validator as slashed when penalty consumes entire stake", async function () {
      await validatorManager.slashValidator(validator1.address, MIN_STAKE, owner.address);

      const [stakedAmount,,, , status] = await validatorManager.getValidator(validator1.address);
      expect(stakedAmount).to.equal(0);
      expect(status).to.equal(3); // Slashed
      expect(await validatorManager.activeValidatorCount()).to.equal(0);
      expect(await validatorManager.totalActiveStake()).to.equal(0);
    });
  });

  describe("configuration updates", function () {
    it("allows owner to update limits", async function () {
      await validatorManager.setMinStake(ethers.parseEther("1500"));
      expect(await validatorManager.minStake()).to.equal(ethers.parseEther("1500"));

      await validatorManager.setLockupPeriod(42);
      expect(await validatorManager.lockupPeriod()).to.equal(42);

      await validatorManager.setMaxValidators(10);
      expect(await validatorManager.maxValidators()).to.equal(10);
    });

    it("prevents non-owner configuration changes", async function () {
      await expect(
        validatorManager.connect(validator1).setMinStake(MIN_STAKE)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

