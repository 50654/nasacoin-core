// NASA Coin Dashboard - Interactive JavaScript Application
class NASACoinDashboard {
    constructor() {
        this.rpcUrl = 'http://localhost:18334';
        this.rpcUser = 'nasauser';
        this.rpcPassword = 'supersecurepassword';
        this.isConnected = false;
        this.isMining = false;
        this.updateInterval = null;
        this.miningInterval = null;
        this.currentAddress = null;
        this.blocksFound = 0;
        this.walletIntegration = null;
        this.priceTracker = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeIntegrations();
        await this.checkConnection();
        this.startPeriodicUpdates();
        this.hideLoadingOverlay();
    }

    initializeIntegrations() {
        // Initialize wallet integration
        if (typeof WalletIntegration !== 'undefined') {
            this.walletIntegration = new WalletIntegration();
        }
        
        // Initialize price tracker
        if (typeof PriceTracker !== 'undefined') {
            this.priceTracker = new PriceTracker();
            this.priceTracker.init();
        }
    }

    setupEventListeners() {
        // Mining controls
        document.getElementById('startMining').addEventListener('click', () => this.startMining());
        document.getElementById('stopMining').addEventListener('click', () => this.stopMining());
        
        // Wallet controls
        document.getElementById('copyAddress').addEventListener('click', () => this.copyAddress());
        
        // Blockchain explorer
        document.getElementById('searchBtn').addEventListener('click', () => this.searchBlockchain());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBlockchain();
        });
    }

    async checkConnection() {
        try {
            const response = await this.makeRPCCall('getblockchaininfo');
            if (response && response.result) {
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
                await this.updateDashboard();
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            console.error('Connection failed:', error);
            this.isConnected = false;
            this.updateConnectionStatus('error', 'Connection Failed');
            this.showToast('Failed to connect to NASA Coin node', 'error');
        }
    }

    async makeRPCCall(method, params = []) {
        const requestData = {
            jsonrpc: '1.0',
            id: '1',
            method: method,
            params: params
        };

        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(this.rpcUser + ':' + this.rpcPassword)
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('RPC call failed:', error);
            throw error;
        }
    }

    async updateDashboard() {
        if (!this.isConnected) return;

        try {
            // Get blockchain info
            const blockchainInfo = await this.makeRPCCall('getblockchaininfo');
            const networkInfo = await this.makeRPCCall('getnetworkinfo');
            const miningInfo = await this.makeRPCCall('getmininginfo');
            const balance = await this.makeRPCCall('getbalance');

            // Update stats
            this.updateElement('blockHeight', blockchainInfo.result.blocks.toLocaleString());
            this.updateElement('balance', balance.result.toFixed(2));
            this.updateElement('difficulty', miningInfo.result.difficulty.toFixed(2));
            this.updateElement('connections', networkInfo.result.connections);

            // Update mining status
            this.isMining = miningInfo.result.generate;
            this.updateMiningStatus();
            this.updateElement('hashRate', this.formatHashRate(miningInfo.result.networkhashps));
            this.updateElement('blocksFound', this.blocksFound);

            // Update recent blocks
            await this.updateRecentBlocks();

        } catch (error) {
            console.error('Failed to update dashboard:', error);
            this.showToast('Failed to update dashboard data', 'error');
        }
    }

    async updateRecentBlocks() {
        try {
            const blockchainInfo = await this.makeRPCCall('getblockchaininfo');
            const currentHeight = blockchainInfo.result.blocks;
            const blocksList = document.getElementById('blocksList');
            blocksList.innerHTML = '';

            // Get last 5 blocks
            for (let i = 0; i < 5; i++) {
                const blockHeight = currentHeight - i;
                if (blockHeight < 0) break;

                const blockHash = await this.makeRPCCall('getblockhash', [blockHeight]);
                const blockInfo = await this.makeRPCCall('getblock', [blockHash.result]);

                const blockElement = this.createBlockElement(blockHeight, blockHash.result, blockInfo.result);
                blocksList.appendChild(blockElement);
            }
        } catch (error) {
            console.error('Failed to update recent blocks:', error);
        }
    }

    createBlockElement(height, hash, blockInfo) {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'block-item';
        
        const time = new Date(blockInfo.time * 1000).toLocaleString();
        const shortHash = hash.substring(0, 16) + '...';
        
        blockDiv.innerHTML = `
            <div class="block-info">
                <div class="block-height">Block #${height.toLocaleString()}</div>
                <div class="block-hash">${shortHash}</div>
            </div>
            <div class="block-time">${time}</div>
        `;

        return blockDiv;
    }

    async startMining() {
        if (!this.isConnected) {
            this.showToast('Not connected to NASA Coin node', 'error');
            return;
        }

        try {
            const threads = parseInt(document.getElementById('threads').value) || 1;
            
            // Set generation to true
            await this.makeRPCCall('setgenerate', [true, threads]);
            
            this.isMining = true;
            this.updateMiningStatus();
            this.updateMiningButtons();
            this.showToast('Mining started successfully!', 'success');
            
            // Start monitoring mining stats
            this.startMiningMonitoring();
            
        } catch (error) {
            console.error('Failed to start mining:', error);
            this.showToast('Failed to start mining', 'error');
        }
    }

    async stopMining() {
        try {
            await this.makeRPCCall('setgenerate', [false]);
            
            this.isMining = false;
            this.updateMiningStatus();
            this.updateMiningButtons();
            this.showToast('Mining stopped', 'info');
            
            // Stop monitoring
            if (this.miningInterval) {
                clearInterval(this.miningInterval);
                this.miningInterval = null;
            }
            
        } catch (error) {
            console.error('Failed to stop mining:', error);
            this.showToast('Failed to stop mining', 'error');
        }
    }

    startMiningMonitoring() {
        this.miningInterval = setInterval(async () => {
            try {
                const miningInfo = await this.makeRPCCall('getmininginfo');
                this.updateElement('hashRate', this.formatHashRate(miningInfo.result.networkhashps));
                
                // Check if we found a new block
                const blockchainInfo = await this.makeRPCCall('getblockchaininfo');
                const currentHeight = blockchainInfo.result.blocks;
                
                // This is a simplified check - in reality you'd track this more carefully
                if (currentHeight > this.lastKnownHeight) {
                    this.blocksFound++;
                    this.updateElement('blocksFound', this.blocksFound);
                    this.showToast('New block found! 🎉', 'success');
                }
                
                this.lastKnownHeight = currentHeight;
                
            } catch (error) {
                console.error('Mining monitoring error:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    async generateAddress() {
        if (!this.isConnected) {
            this.showToast('Not connected to NASA Coin node', 'error');
            return;
        }

        try {
            const response = await this.makeRPCCall('getnewaddress');
            this.currentAddress = response.result;
            document.getElementById('currentAddress').value = this.currentAddress;
            this.showToast('New address generated', 'success');
        } catch (error) {
            console.error('Failed to generate address:', error);
            this.showToast('Failed to generate address', 'error');
        }
    }

    async refreshBalance() {
        if (!this.isConnected) {
            this.showToast('Not connected to NASA Coin node', 'error');
            return;
        }

        try {
            await this.updateDashboard();
            this.showToast('Balance refreshed', 'success');
        } catch (error) {
            console.error('Failed to refresh balance:', error);
            this.showToast('Failed to refresh balance', 'error');
        }
    }

    copyAddress() {
        const addressInput = document.getElementById('currentAddress');
        if (addressInput.value) {
            addressInput.select();
            document.execCommand('copy');
            this.showToast('Address copied to clipboard', 'success');
        } else {
            this.showToast('No address to copy', 'warning');
        }
    }

    async searchBlockchain() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (!searchTerm) {
            this.showToast('Please enter a search term', 'warning');
            return;
        }

        if (!this.isConnected) {
            this.showToast('Not connected to NASA Coin node', 'error');
            return;
        }

        try {
            // Try to search by block height
            if (/^\d+$/.test(searchTerm)) {
                const blockHeight = parseInt(searchTerm);
                const blockHash = await this.makeRPCCall('getblockhash', [blockHeight]);
                const blockInfo = await this.makeRPCCall('getblock', [blockHash.result]);
                
                this.showSearchResult('Block', {
                    Height: blockHeight,
                    Hash: blockHash.result,
                    Time: new Date(blockInfo.result.time * 1000).toLocaleString(),
                    Transactions: blockInfo.result.tx.length
                });
            }
            // Try to search by block hash
            else if (searchTerm.length === 64) {
                const blockInfo = await this.makeRPCCall('getblock', [searchTerm]);
                this.showSearchResult('Block', {
                    Height: blockInfo.result.height,
                    Hash: searchTerm,
                    Time: new Date(blockInfo.result.time * 1000).toLocaleString(),
                    Transactions: blockInfo.result.tx.length
                });
            }
            // Try to search by address
            else {
                const balance = await this.makeRPCCall('getreceivedbyaddress', [searchTerm]);
                this.showSearchResult('Address', {
                    Address: searchTerm,
                    'Total Received': balance.result.toFixed(8) + ' NASAPEPE'
                });
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showToast('Search failed - invalid input or not found', 'error');
        }
    }

    showSearchResult(type, data) {
        const result = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        
        alert(`${type} Information:\n\n${result}`);
    }

    updateMiningStatus() {
        const statusElement = document.getElementById('miningStatus');
        const statusText = statusElement.querySelector('.status-text');
        const statusIndicator = statusElement.querySelector('.status-indicator');
        
        if (this.isMining) {
            statusElement.classList.add('mining');
            statusText.textContent = 'Mining';
        } else {
            statusElement.classList.remove('mining');
            statusText.textContent = 'Stopped';
        }
    }

    updateMiningButtons() {
        const startBtn = document.getElementById('startMining');
        const stopBtn = document.getElementById('stopMining');
        
        if (this.isMining) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        const icon = statusElement.querySelector('i');
        const textElement = statusElement.querySelector('span');
        
        statusElement.className = `connection-status ${status}`;
        textElement.textContent = text;
    }

    startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.isConnected) {
                this.updateDashboard();
            } else {
                this.checkConnection();
            }
        }, 10000); // Update every 10 seconds
    }

    hideLoadingOverlay() {
        setTimeout(() => {
            const overlay = document.getElementById('loadingOverlay');
            overlay.classList.remove('show');
        }, 1000);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 5000);
    }

    formatHashRate(hashRate) {
        if (hashRate >= 1e18) return (hashRate / 1e18).toFixed(2) + ' EH/s';
        if (hashRate >= 1e15) return (hashRate / 1e15).toFixed(2) + ' PH/s';
        if (hashRate >= 1e12) return (hashRate / 1e12).toFixed(2) + ' TH/s';
        if (hashRate >= 1e9) return (hashRate / 1e9).toFixed(2) + ' GH/s';
        if (hashRate >= 1e6) return (hashRate / 1e6).toFixed(2) + ' MH/s';
        if (hashRate >= 1e3) return (hashRate / 1e3).toFixed(2) + ' KH/s';
        return hashRate.toFixed(2) + ' H/s';
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.nasaCoinDashboard = new NASACoinDashboard();
});

// Handle page visibility changes to pause/resume updates
document.addEventListener('visibilitychange', () => {
    if (window.nasaCoinDashboard) {
        if (document.hidden) {
            // Page is hidden, pause updates
            if (window.nasaCoinDashboard.updateInterval) {
                clearInterval(window.nasaCoinDashboard.updateInterval);
            }
        } else {
            // Page is visible, resume updates
            window.nasaCoinDashboard.startPeriodicUpdates();
        }
    }
});

// Handle window beforeunload to clean up
window.addEventListener('beforeunload', () => {
    if (window.nasaCoinDashboard) {
        if (window.nasaCoinDashboard.updateInterval) {
            clearInterval(window.nasaCoinDashboard.updateInterval);
        }
        if (window.nasaCoinDashboard.miningInterval) {
            clearInterval(window.nasaCoinDashboard.miningInterval);
        }
    }
});