/**
 * Common utilities for deployment scripts
 */
const fs = require('fs');
const path = require('path');

/**
 * Loads deployment information from the deployments directory
 * @param {Object} network - The network object from ethers
 * @returns {Object} Deployment information
 */
function loadDeploymentInfo(network) {
    const deploymentFile = path.join(__dirname, '..', 'deployments', `${network.name}-${network.chainId}.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        console.error('❌ Deployment file not found. Please deploy the contract first.');
        process.exit(1);
    }

    return JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
}

/**
 * Prints network and deployment information
 * @param {Object} network - The network object from ethers
 * @param {string} contractAddress - The contract address
 */
function printNetworkInfo(network, contractAddress) {
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`📍 Contract Address: ${contractAddress}`);
}

module.exports = {
    loadDeploymentInfo,
    printNetworkInfo
};
