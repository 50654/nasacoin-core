const { ethers } = require("hardhat");
const { loadDeploymentInfo, printNetworkInfo } = require("../utils/deployment-helpers");

async function main() {
  console.log("🚀 NASA Coin Contract Interaction");
  console.log("=================================");

  const [deployer, user1, user2] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo(network);
  const contractAddress = deploymentInfo.contractAddress;

  // Print network and contract info
  printNetworkInfo(network, contractAddress);

  // Connect to the deployed contract
  const NASACoin = await ethers.getContractFactory("NASACoin");
  const nasaCoin = NASACoin.attach(contractAddress);

  // Display current contract state
  console.log("\n📊 Current Contract State:");
  console.log("==========================");
  
  const name = await nasaCoin.name();
  const symbol = await nasaCoin.symbol();
  const totalSupply = await nasaCoin.totalSupply();
  const maxSupply = await nasaCoin.MAX_SUPPLY();
  const blockReward = await nasaCoin.BLOCK_REWARD();
  const miningDifficulty = await nasaCoin.miningDifficulty();
  const stakingAPY = await nasaCoin.stakingAPY();
  
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Max Supply: ${ethers.utils.formatEther(maxSupply)} ${symbol}`);
  console.log(`   Block Reward: ${ethers.utils.formatEther(blockReward)} ${symbol}`);
  console.log(`   Mining Difficulty: ${miningDifficulty}`);
  console.log(`   Staking APY: ${stakingAPY / 100}%`);

  // Check balances
  console.log("\n💰 Account Balances:");
  console.log("====================");
  
  const deployerBalance = await nasaCoin.balanceOf(deployer.address);
  const user1Balance = await nasaCoin.balanceOf(user1.address);
  const user2Balance = await nasaCoin.balanceOf(user2.address);
  
  console.log(`   Deployer: ${ethers.utils.formatEther(deployerBalance)} ${symbol}`);
  console.log(`   User1: ${ethers.utils.formatEther(user1Balance)} ${symbol}`);
  console.log(`   User2: ${ethers.utils.formatEther(user2Balance)} ${symbol}`);

  // Demonstrate functionality
  console.log("\n🧪 Testing Contract Functions:");
  console.log("==============================");

  try {
    // 1. Transfer tokens to users
    console.log("\n1. Transferring tokens to users...");
    const transferAmount = ethers.utils.parseEther("1000");
    
    if (deployerBalance.gte(transferAmount.mul(2))) {
      await nasaCoin.transfer(user1.address, transferAmount);
      await nasaCoin.transfer(user2.address, transferAmount);
      console.log(`   ✅ Transferred ${ethers.utils.formatEther(transferAmount)} ${symbol} to each user`);
    } else {
      console.log("   ⚠️  Insufficient balance for transfers");
    }

    // 2. Test mining
    console.log("\n2. Testing mining functionality...");
    const miningInfo = await nasaCoin.getMiningInfo(user1.address);
    console.log(`   Mining difficulty: ${miningInfo.currentDifficulty}`);
    console.log(`   Can mine: ${miningInfo.canMine}`);
    
    if (miningInfo.canMine) {
      console.log("   Attempting to mine...");
      let mined = false;
      
      // Try different nonces
      for (let nonce = 0; nonce < 1000 && !mined; nonce++) {
        try {
          const tx = await nasaCoin.connect(user1).mine(nonce);
          await tx.wait();
          mined = true;
          console.log(`   ✅ Successfully mined with nonce: ${nonce}`);
          
          const newBalance = await nasaCoin.balanceOf(user1.address);
          console.log(`   New balance: ${ethers.utils.formatEther(newBalance)} ${symbol}`);
        } catch (error) {
          // Continue trying
        }
      }
      
      if (!mined) {
        console.log("   ⚠️  Mining attempt unsuccessful (try more nonces)");
      }
    }

    // 3. Test staking
    console.log("\n3. Testing staking functionality...");
    const stakeAmount = ethers.utils.parseEther("100");
    const user2Balance2 = await nasaCoin.balanceOf(user2.address);
    
    if (user2Balance2.gte(stakeAmount)) {
      console.log(`   Staking ${ethers.utils.formatEther(stakeAmount)} ${symbol}...`);
      await nasaCoin.connect(user2).stake(stakeAmount);
      
      const stakingInfo = await nasaCoin.getStakingInfo(user2.address);
      console.log(`   ✅ Staked amount: ${ethers.utils.formatEther(stakingInfo.stakedAmount)} ${symbol}`);
      console.log(`   Staking start time: ${new Date(stakingInfo.stakingTime * 1000).toLocaleString()}`);
    } else {
      console.log("   ⚠️  Insufficient balance for staking");
    }

    // 4. Check updated balances
    console.log("\n4. Updated balances:");
    const finalDeployerBalance = await nasaCoin.balanceOf(deployer.address);
    const finalUser1Balance = await nasaCoin.balanceOf(user1.address);
    const finalUser2Balance = await nasaCoin.balanceOf(user2.address);
    const finalTotalSupply = await nasaCoin.totalSupply();
    
    console.log(`   Deployer: ${ethers.utils.formatEther(finalDeployerBalance)} ${symbol}`);
    console.log(`   User1: ${ethers.utils.formatEther(finalUser1Balance)} ${symbol}`);
    console.log(`   User2: ${ethers.utils.formatEther(finalUser2Balance)} ${symbol}`);
    console.log(`   Total Supply: ${ethers.utils.formatEther(finalTotalSupply)} ${symbol}`);

  } catch (error) {
    console.error("❌ Error during interaction:", error.message);
  }

  console.log("\n🎉 Contract interaction completed!");
  console.log("\n📋 Next Steps:");
  console.log("   - Add liquidity to DEX");
  console.log("   - Set up frontend integration");
  console.log("   - Configure mining pools");
  console.log("   - Test with real users");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });