/**
 * Common test utilities for NASACoin tests
 */
const { ethers } = require('hardhat');

/**
 * Deploys the NASACoin contract and returns the contract instance and signers
 * @returns {Promise<Object>} Object containing nasaCoin contract and signers
 */
async function deployNASACoin() {
    // Get signers
    const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const NASACoin = await ethers.getContractFactory('NASACoin');
    const nasaCoin = await NASACoin.deploy();
    await nasaCoin.waitForDeployment();

    return {
        nasaCoin,
        owner,
        addr1,
        addr2,
        addrs
    };
}

module.exports = {
    deployNASACoin
};
