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
  
  // Estimate gas
  const deploymentData = NASACoin.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deploymentData);
  const gasPrice = await ethers.provider.getGasPrice();
  const deploymentCost = estimatedGas.mul(gasPrice);
  
  console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
  console.log(`💸 Estimated cost: ${ethers.utils.formatEther(deploymentCost)} ETH`);
  
  // Deploy the contract
  console.log("\n🚀 Deploying NASA Coin contract...");
  const nasaCoin = await NASACoin.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await nasaCoin.deployed();
  
  console.log("✅ NASA Coin deployed successfully!");
  console.log(`📍 Contract address: ${nasaCoin.address}`);
  console.log(`🔗 Transaction hash: ${nasaCoin.deployTransaction.hash}`);
  
  // Get deployment receipt
  const receipt = await nasaCoin.deployTransaction.wait();
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`💰 Deployment cost: ${ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))} ETH`);
  
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
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    deploymentCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
    timestamp: new Date().toISOString(),
    contractDetails: {
      name,
      symbol,
      decimals,
      initialSupply: ethers.utils.formatEther(totalSupply),
      maxSupply: ethers.utils.formatEther(maxSupply),
      blockReward: ethers.utils.formatEther(blockReward)
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
    console.log(`📄 ABI saved to: ${abiFile}`);
  }
  
  // Generate frontend config
  const frontendConfig = {
    contractAddress: nasaCoin.address,
    chainId: network.chainId,
    networkName: network.name,
    abi: JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi
  };
  
  const configFile = path.join(__dirname, "..", "frontend-config.js");
  const configContent = `// NASA Coin Contract Configuration
// Auto-generated on ${new Date().toISOString()}

export const NASA_COIN_CONFIG = ${JSON.stringify(frontendConfig, null, 2)};

// Contract ABI
export const NASA_COIN_ABI = ${JSON.stringify(frontendConfig.abi, null, 2)};
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