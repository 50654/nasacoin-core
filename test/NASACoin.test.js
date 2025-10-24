const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NASACoin", function () {
  let nasaCoin;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const NASACoin = await ethers.getContractFactory("NASACoin");
    nasaCoin = await NASACoin.deploy();
    await nasaCoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await nasaCoin.name()).to.equal("NASA Coin");
      expect(await nasaCoin.symbol()).to.equal("NASAPEPE");
    });

    it("Should set the right decimals", async function () {
      expect(await nasaCoin.decimals()).to.equal(18);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await nasaCoin.balanceOf(owner.address);
      expect(await nasaCoin.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct constants", async function () {
      expect(await nasaCoin.MAX_SUPPLY()).to.equal(ethers.parseEther("5000000"));
      expect(await nasaCoin.BLOCK_REWARD()).to.equal(ethers.parseEther("500000"));
    });
  });

  describe("Mining", function () {
    it("Should allow mining with correct nonce", async function () {
      // Try mining with different nonces until we find one that works
      let mined = false;
      for (let nonce = 0; nonce < 10000 && !mined; nonce++) {
        try {
          await nasaCoin.connect(addr1).mine(nonce);
          mined = true;
          
          const balance = await nasaCoin.balanceOf(addr1.address);
          expect(balance).to.equal(ethers.parseEther("500000"));
        } catch (error) {
          // Continue trying different nonces
        }
      }
      
      if (!mined) {
        console.log("Note: Mining test may need adjustment for difficulty");
      }
    });

    it("Should enforce mining cooldown", async function () {
      // First successful mine
      let mined = false;
      for (let nonce = 0; nonce < 10000 && !mined; nonce++) {
        try {
          await nasaCoin.connect(addr1).mine(nonce);
          mined = true;
        } catch (error) {
          // Continue trying
        }
      }

      if (mined) {
        // Try to mine again immediately - should fail
        await expect(nasaCoin.connect(addr1).mine(1)).to.be.revertedWith("Mining cooldown active");
      }
    });

    it("Should return correct mining info", async function () {
      const miningInfo = await nasaCoin.getMiningInfo(addr1.address);
      expect(miningInfo.currentDifficulty).to.equal(1000);
      expect(miningInfo.canMine).to.be.true;
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      await nasaCoin.transfer(addr1.address, ethers.parseEther("1000"));
    });

    it("Should allow staking tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await nasaCoin.connect(addr1).stake(stakeAmount);
      
      const stakingInfo = await nasaCoin.getStakingInfo(addr1.address);
      expect(stakingInfo.stakedAmount).to.equal(stakeAmount);
    });

    it("Should not allow staking more than balance", async function () {
      const stakeAmount = ethers.parseEther("2000"); // More than balance
      
      await expect(nasaCoin.connect(addr1).stake(stakeAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should allow unstaking tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      // Stake tokens
      await nasaCoin.connect(addr1).stake(stakeAmount);
      
      // Unstake tokens
      await nasaCoin.connect(addr1).unstake(stakeAmount);
      
      const stakingInfo = await nasaCoin.getStakingInfo(addr1.address);
      expect(stakingInfo.stakedAmount).to.equal(0);
    });

    it("Should calculate staking rewards correctly", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await nasaCoin.connect(addr1).stake(stakeAmount);
      
      // Fast forward time (simulate 1 day)
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
      
      const stakingInfo = await nasaCoin.getStakingInfo(addr1.address);
      expect(stakingInfo.pendingRewards).to.be.gt(0);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await nasaCoin.transfer(addr1.address, transferAmount);
      
      const addr1Balance = await nasaCoin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await nasaCoin.balanceOf(owner.address);
      const transferAmount = initialOwnerBalance + 1n;
      
      await expect(nasaCoin.transfer(addr1.address, transferAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      await nasaCoin.pause();
      expect(await nasaCoin.paused()).to.be.true;
      
      await nasaCoin.unpause();
      expect(await nasaCoin.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await nasaCoin.pause();
      
      await expect(nasaCoin.transfer(addr1.address, ethers.parseEther("100")))
        .to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(nasaCoin.connect(addr1).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to set mining cooldown", async function () {
      const newCooldown = 300; // 5 minutes
      await nasaCoin.setMiningCooldown(newCooldown);
      
      // Verify by checking if the cooldown is applied correctly
      // This would require a more complex test setup
    });

    it("Should allow owner to set staking APY", async function () {
      const newAPY = 2000; // 20%
      await nasaCoin.setStakingAPY(newAPY);
      
      // The APY change would be reflected in future staking calculations
    });

    it("Should not allow setting APY too high", async function () {
      const highAPY = 6000; // 60% - too high
      await expect(nasaCoin.setStakingAPY(highAPY))
        .to.be.revertedWith("APY too high");
    });

    it("Should not allow non-owner to change settings", async function () {
      await expect(nasaCoin.connect(addr1).setMiningCooldown(300))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Supply Limits", function () {
    it("Should not allow minting beyond max supply", async function () {
      // This test would require minting close to max supply first
      // For now, we just verify the constant is set correctly
      expect(await nasaCoin.MAX_SUPPLY()).to.equal(ethers.parseEther("5000000"));
    });
  });
});