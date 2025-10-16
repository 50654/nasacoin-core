// NASA Coin Dashboard Configuration
// Update these settings to match your NASA Coin node configuration

const CONFIG = {
    // RPC Connection Settings
    RPC_URL: 'http://localhost:18334',
    RPC_USER: 'nasauser',
    RPC_PASSWORD: 'supersecurepassword',
    
    // Smart Contract Settings (will be updated after deployment)
    CONTRACT_ADDRESS: '0x...', // Update after deployment
    CHAIN_ID: 11155111, // Sepolia testnet
    
    // Update Intervals (in milliseconds)
    DASHBOARD_UPDATE_INTERVAL: 10000,  // 10 seconds
    MINING_MONITOR_INTERVAL: 5000,     // 5 seconds
    
    // UI Settings
    MAX_RECENT_BLOCKS: 5,
    TOAST_DURATION: 5000,              // 5 seconds
    
    // Mining Settings
    DEFAULT_CPU_THREADS: 1,
    MAX_CPU_THREADS: 16,
    
    // Network Settings
    NETWORK_NAME: 'NASA Coin Mainnet',
    P2P_PORT: 8334,
    RPC_PORT: 18334,
    MAX_SUPPLY: '5,000,000 NASAPEPE',
    BLOCK_REWARD: '500,000 NASAPEPE'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}