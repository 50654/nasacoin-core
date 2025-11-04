const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting NASA Coin Token Deployment...");
  console.log("==========================================");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deploying with account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.log("⚠️  Warning: Low balance, deployment might fail");
  }

    // Get the contract factory
    console.log("\n📦 Compiling contracts...");
    const NASACoin = await ethers.getContractFactory("NASACoin");

    // Estimate gas for NASACoin deployment
    const nasaCoinDeployTx = NASACoin.getDeployTransaction();
    const currentGasPrice = await ethers.provider.getGasPrice();
    const estimatedNasaCoinGas = await ethers.provider.estimateGas(nasaCoinDeployTx);
    const nasaCoinDeploymentCost = estimatedNasaCoinGas.mul(currentGasPrice);

    console.log(`⛽ Estimated gas (NASA Coin): ${estimatedNasaCoinGas.toString()}`);
    console.log(`💸 Estimated cost (NASA Coin): ${ethers.utils.formatEther(nasaCoinDeploymentCost)} ETH`);

    // Deploy NASACoin
    console.log("\n🚀 Deploying NASA Coin contract...");
    const nasaCoin = await NASACoin.deploy();

    console.log("⏳ Waiting for NASA Coin deployment confirmation...");
    await nasaCoin.deployed();

    console.log("✅ NASA Coin deployed successfully!");
    console.log(`📍 NASACoin address: ${nasaCoin.address}`);
    console.log(`🔗 Transaction hash: ${nasaCoin.deployTransaction.hash}`);

    const nasaCoinReceipt = await nasaCoin.deployTransaction.wait();
    console.log(`⛽ Gas used (NASA Coin): ${nasaCoinReceipt.gasUsed.toString()}`);
    console.log(`💰 Deployment cost (NASA Coin): ${ethers.utils.formatEther(nasaCoinReceipt.gasUsed.mul(nasaCoinReceipt.effectiveGasPrice))} ETH`);

    // Deploy ProofOfStakeValidatorManager
    const ProofOfStakeValidatorManager = await ethers.getContractFactory("ProofOfStakeValidatorManager");

    const minStakeInput = process.env.VALIDATOR_MIN_STAKE || "1000";
    const validatorMinStake = ethers.utils.parseUnits(minStakeInput, 18);
    const validatorLockup = Number(process.env.VALIDATOR_LOCKUP_PERIOD || 7 * 24 * 60 * 60);
    const validatorMaxCount = Number(process.env.VALIDATOR_MAX_VALIDATORS || 50);

    console.log("\n🛠️ Validator Manager Configuration:");
    console.log(`   Min Stake: ${minStakeInput} NASAPEPE`);
    console.log(`   Lockup Period: ${validatorLockup} seconds`);
    console.log(`   Max Validators: ${validatorMaxCount}`);

    let validatorManager;
    let validatorReceipt;

    try {
      validatorManager = await ProofOfStakeValidatorManager.deploy(
        nasaCoin.address,
        validatorMinStake,
        validatorLockup,
        validatorMaxCount
      );

      console.log("⏳ Waiting for Validator Manager deployment confirmation...");
      await validatorManager.deployed();

      console.log("✅ Validator Manager deployed successfully!");
      console.log(`📍 Validator Manager address: ${validatorManager.address}`);
      console.log(`🔗 Transaction hash: ${validatorManager.deployTransaction.hash}`);

      validatorReceipt = await validatorManager.deployTransaction.wait();
      console.log(`⛽ Gas used (Validator Manager): ${validatorReceipt.gasUsed.toString()}`);
      console.log(`💰 Deployment cost (Validator Manager): ${ethers.utils.formatEther(validatorReceipt.gasUsed.mul(validatorReceipt.effectiveGasPrice))} ETH`);
    } catch (error) {
      console.error("❌ Validator Manager deployment failed", error);
      throw error;
    }
  
  // Verify contract details
  console.log("\n📊 Contract Details:");
  const name = await nasaCoin.name();
  const symbol = await nasaCoin.symbol();
  const decimals = await nasaCoin.decimals();
  const totalSupply = await nasaCoin.totalSupply();
  const maxSupply = await nasaCoin.MAX_SUPPLY();
  const blockReward = await nasaCoin.BLOCK_REWARD();
  
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Initial Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Max Supply: ${ethers.utils.formatEther(maxSupply)} ${symbol}`);
  console.log(`   Block Reward: ${ethers.utils.formatEther(blockReward)} ${symbol}`);
  
  // Save deployment info
      const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: nasaCoin.address,
    deployerAddress: deployer.address,
    transactionHash: nasaCoin.deployTransaction.hash,
      blockNumber: nasaCoinReceipt.blockNumber,
      gasUsed: nasaCoinReceipt.gasUsed.toString(),
      deploymentCost: ethers.utils.formatEther(nasaCoinReceipt.gasUsed.mul(nasaCoinReceipt.effectiveGasPrice)),
    timestamp: new Date().toISOString(),
    contractDetails: {
      name,
      symbol,
      decimals,
      initialSupply: ethers.utils.formatEther(totalSupply),
      maxSupply: ethers.utils.formatEther(maxSupply),
      blockReward: ethers.utils.formatEther(blockReward)
      },
      validatorManager: {
        address: validatorManager.address,
        transactionHash: validatorManager.deployTransaction.hash,
          blockNumber: validatorReceipt.blockNumber,
          gasUsed: validatorReceipt.gasUsed.toString(),
          deploymentCost: ethers.utils.formatEther(validatorReceipt.gasUsed.mul(validatorReceipt.effectiveGasPrice)),
        configuration: {
          minStake: minStakeInput,
          lockupPeriodSeconds: validatorLockup,
          maxValidators: validatorMaxCount
        }
      }
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);
  
  // Generate ABI file for frontend
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "NASACoin.sol", "NASACoin.json");
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const abiFile = path.join(deploymentsDir, `NASACoin-ABI.json`);
      fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
      console.log(`📄 NASACoin ABI saved to: ${abiFile}`);
    }

    const validatorArtifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "ProofOfStakeValidatorManager.sol",
      "ProofOfStakeValidatorManager.json"
    );

    if (fs.existsSync(validatorArtifactPath)) {
      const validatorArtifact = JSON.parse(fs.readFileSync(validatorArtifactPath, "utf8"));
      const validatorAbiFile = path.join(deploymentsDir, `ProofOfStakeValidatorManager-ABI.json`);
      fs.writeFileSync(validatorAbiFile, JSON.stringify(validatorArtifact.abi, null, 2));
      console.log(`📄 Validator Manager ABI saved to: ${validatorAbiFile}`);
    }
  
  // Generate frontend config
    const frontendConfig = {
      nasaCoin: {
        contractAddress: nasaCoin.address,
        abi: JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi
      },
      validatorManager: {
        contractAddress: validatorManager.address,
        abi: fs.existsSync(validatorArtifactPath)
          ? JSON.parse(fs.readFileSync(validatorArtifactPath, "utf8")).abi
          : []
      },
      chainId: network.chainId,
      networkName: network.name,
      validatorConfig: {
        minStake: minStakeInput,
        lockupPeriodSeconds: validatorLockup,
        maxValidators: validatorMaxCount
      }
    };
  
  const configFile = path.join(__dirname, "..", "frontend-config.js");
  const configContent = `// NASA Coin Contract Configuration
// Auto-generated on ${new Date().toISOString()}

export const NASA_COIN_CONFIG = ${JSON.stringify(frontendConfig, null, 2)};

// Contract ABIs
export const NASA_COIN_ABI = NASA_COIN_CONFIG.nasaCoin.abi;
export const VALIDATOR_MANAGER_ABI = NASA_COIN_CONFIG.validatorManager.abi;
`;
  
  fs.writeFileSync(configFile, configContent);
  console.log(`⚙️  Frontend config saved to: ${configFile}`);
  
  // Instructions for next steps
  console.log("\n🎉 Deployment Complete!");
  console.log("========================");
  console.log("\n📋 Next Steps:");
  console.log("1. Verify the contract on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${nasaCoin.address}`);
  console.log("\n2. Add liquidity to DEX (if mainnet):");
  console.log("   - Uniswap: https://app.uniswap.org/#/add/v2");
  console.log("   - PancakeSwap: https://pancakeswap.finance/add");
  console.log("\n3. Update your frontend configuration:");
  console.log(`   - Contract Address: ${nasaCoin.address}`);
  console.log(`   - Chain ID: ${network.chainId}`);
  console.log("\n4. Test the contract:");
  console.log("   - Try mining some tokens");
  console.log("   - Test staking functionality");
  console.log("   - Verify transfers work correctly");
  
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`\n🔍 View on Block Explorer:`);
    if (network.chainId === 1) {
      console.log(`   https://etherscan.io/address/${nasaCoin.address}`);
    } else if (network.chainId === 11155111) {
      console.log(`   https://sepolia.etherscan.io/address/${nasaCoin.address}`);
    } else if (network.chainId === 137) {
      console.log(`   https://polygonscan.com/address/${nasaCoin.address}`);
    } else if (network.chainId === 80001) {
      console.log(`   https://mumbai.polygonscan.com/address/${nasaCoin.address}`);
    } else if (network.chainId === 43114) {
      console.log(`   https://snowtrace.io/address/${nasaCoin.address}`);
    } else if (network.chainId === 56) {
      console.log(`   https://bscscan.com/address/${nasaCoin.address}`);
    } else if (network.chainId === 97) {
      console.log(`   https://testnet.bscscan.com/address/${nasaCoin.address}`);
    }
  }
  
  console.log("\n🚀 To the Moon and Beyond! 🌙");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });