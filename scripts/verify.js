const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 NASA Coin Contract Verification");
  console.log("==================================");

  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log("⏳ Starting verification...");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // NASACoin constructor has no arguments
    });

    console.log("✅ Contract verified successfully!");
    
    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verificationDate = new Date().toISOString();
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      process.exit(1);
    }
  }

  // Show block explorer links
  console.log("\n🔗 Block Explorer Links:");
  if (network.chainId === 1) {
    console.log(`   Etherscan: https://etherscan.io/address/${contractAddress}`);
  } else if (network.chainId === 11155111) {
    console.log(`   Sepolia: https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (network.chainId === 137) {
    console.log(`   Polygonscan: https://polygonscan.com/address/${contractAddress}`);
  } else if (network.chainId === 80001) {
    console.log(`   Mumbai: https://mumbai.polygonscan.com/address/${contractAddress}`);
  } else if (network.chainId === 56) {
    console.log(`   BSCScan: https://bscscan.com/address/${contractAddress}`);
  } else if (network.chainId === 97) {
    console.log(`   BSC Testnet: https://testnet.bscscan.com/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });