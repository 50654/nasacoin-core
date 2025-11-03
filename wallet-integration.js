// NASA Coin Wallet Integration Module

// Import UI helpers if available
if (typeof require !== 'undefined') {
    try {
        const { showToast } = require('./utils/ui-helpers');
        var uiShowToast = showToast;
    } catch (e) {
        // Will use window.UIHelpers in browser
    }
}

class WalletIntegration {
    constructor() {
        this.connectedWallet = null;
        this.walletType = null;
        this.web3 = null;
        this.nasaCoinContract = null;
        
        // NASA Coin contract details (you'll need to deploy an ERC-20 version)
        this.contractAddress = '0x...'; // Your NASA Coin ERC-20 contract address
        this.contractABI = [
            // ERC-20 ABI methods
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            // Add more ABI methods as needed
        ];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkExistingConnections();
    }

    setupEventListeners() {
        // MetaMask connection
        document.getElementById('connectMetaMask')?.addEventListener('click', () => this.connectMetaMask());
        
        // Coinbase connection
        document.getElementById('connectCoinbase')?.addEventListener('click', () => this.connectCoinbase());
        
        // Disconnect wallet
        document.getElementById('disconnectWallet')?.addEventListener('click', () => this.disconnectWallet());
        
        // Send transaction
        document.getElementById('sendTransaction')?.addEventListener('click', () => this.showSendModal());
    }

    async checkExistingConnections() {
        // Check if MetaMask is already connected
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectMetaMask(false);
                }
            } catch (error) {
                console.log('No existing MetaMask connection');
            }
        }
    }

    async connectMetaMask(requestPermission = true) {
        if (typeof window.ethereum === 'undefined') {
            this.showToast('MetaMask is not installed. Please install MetaMask extension.', 'error');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        try {
            let accounts;
            if (requestPermission) {
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            } else {
                accounts = await window.ethereum.request({ method: 'eth_accounts' });
            }

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.connectedWallet = accounts[0];
            this.walletType = 'metamask';
            
            // Initialize Web3
            this.web3 = new Web3(window.ethereum);
            
            // Initialize contract
            this.nasaCoinContract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
            
            // Setup event listeners for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.connectedWallet = accounts[0];
                    this.updateWalletDisplay();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            await this.updateWalletDisplay();
            this.showToast('MetaMask connected successfully!', 'success');
            
        } catch (error) {
            console.error('MetaMask connection failed:', error);
            this.showToast('Failed to connect MetaMask: ' + error.message, 'error');
        }
    }

    async connectCoinbase() {
        try {
            // Coinbase Wallet SDK integration
            if (typeof window.CoinbaseWalletSDK === 'undefined') {
                this.showToast('Loading Coinbase Wallet SDK...', 'info');
                await this.loadCoinbaseSDK();
            }

            const coinbaseWallet = new CoinbaseWalletSDK({
                appName: 'NASA Coin Dashboard',
                appLogoUrl: 'https://your-domain.com/logo.png',
                darkMode: true
            });

            const ethereum = coinbaseWallet.makeWeb3Provider();
            
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            
            this.connectedWallet = accounts[0];
            this.walletType = 'coinbase';
            this.web3 = new Web3(ethereum);
            
            await this.updateWalletDisplay();
            this.showToast('Coinbase Wallet connected successfully!', 'success');
            
        } catch (error) {
            console.error('Coinbase connection failed:', error);
            this.showToast('Failed to connect Coinbase Wallet: ' + error.message, 'error');
        }
    }

    async loadCoinbaseSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@coinbase/wallet-sdk@3.6.6/dist/index.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    disconnectWallet() {
        this.connectedWallet = null;
        this.walletType = null;
        this.web3 = null;
        this.nasaCoinContract = null;
        
        this.updateWalletDisplay();
        this.showToast('Wallet disconnected', 'info');
    }

    async updateWalletDisplay() {
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const walletDetails = document.getElementById('walletDetails');
        const nasapepeBalance = document.getElementById('nasapepeBalance');

        if (this.connectedWallet) {
            if (walletStatus) {
                walletStatus.textContent = `Connected (${this.walletType})`;
                walletStatus.className = 'wallet-status connected';
            }

            if (walletAddress) {
                walletAddress.value = this.connectedWallet;
            }

            if (walletDetails) {
                walletDetails.style.display = 'block';
                walletDetails.classList.add('show');
            }

            try {
                const balance = await this.getWalletBalance();
                if (nasapepeBalance) {
                    nasapepeBalance.textContent = balance;
                }
            } catch (error) {
                if (nasapepeBalance) {
                    nasapepeBalance.textContent = '0';
                }
            }

            // Ensure event listeners are bound for dynamic controls if any
            this.setupEventListeners();
        } else {
            if (walletStatus) {
                walletStatus.textContent = 'Not Connected';
                walletStatus.className = 'wallet-status disconnected';
            }

            if (walletAddress) {
                walletAddress.value = '';
            }

            if (nasapepeBalance) {
                nasapepeBalance.textContent = '0';
            }

            if (walletDetails) {
                walletDetails.style.display = 'none';
                walletDetails.classList.remove('show');
            }

            this.setupEventListeners();
        }
    }

    async getWalletBalance() {
        if (!this.web3 || !this.connectedWallet) return '0';
        
        try {
            // Get ETH balance
            const ethBalance = await this.web3.eth.getBalance(this.connectedWallet);
            const ethBalanceFormatted = this.web3.utils.fromWei(ethBalance, 'ether');
            
            // Get NASA Coin token balance (if contract exists)
            if (this.nasaCoinContract) {
                const tokenBalance = await this.nasaCoinContract.methods.balanceOf(this.connectedWallet).call();
                const tokenBalanceFormatted = this.web3.utils.fromWei(tokenBalance, 'ether');
                return tokenBalanceFormatted;
            }
            
            return ethBalanceFormatted;
            
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            return '0';
        }
    }

    showSendModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Send NASAPEPE</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>To Address:</label>
                        <input type="text" id="sendToAddress" placeholder="0x...">
                    </div>
                    <div class="form-group">
                        <label>Amount:</label>
                        <input type="number" id="sendAmount" placeholder="0.0" step="0.000001">
                    </div>
                    <div class="form-group">
                        <label>Gas Price (Gwei):</label>
                        <input type="number" id="gasPrice" value="20" step="1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="confirmSend" class="btn btn-primary">Send Transaction</button>
                    <button id="cancelSend" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners for modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancelSend').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#confirmSend').addEventListener('click', async () => {
            await this.sendTransaction();
            document.body.removeChild(modal);
        });
    }

    async sendTransaction() {
        const toAddress = document.getElementById('sendToAddress').value;
        const amount = document.getElementById('sendAmount').value;
        const gasPrice = document.getElementById('gasPrice').value;
        
        if (!toAddress || !amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const amountWei = this.web3.utils.toWei(amount, 'ether');
            const gasPriceWei = this.web3.utils.toWei(gasPrice, 'gwei');
            
            const transaction = {
                from: this.connectedWallet,
                to: toAddress,
                value: amountWei,
                gasPrice: gasPriceWei,
                gas: 21000
            };
            
            const txHash = await this.web3.eth.sendTransaction(transaction);
            this.showToast(`Transaction sent! Hash: ${txHash.transactionHash}`, 'success');
            
            // Update balance after transaction
            setTimeout(() => this.updateWalletDisplay(), 2000);
            
        } catch (error) {
            console.error('Transaction failed:', error);
            this.showToast('Transaction failed: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        // Use the UIHelpers utility if available
        if (typeof uiShowToast === 'function') {
            uiShowToast(message, type);
        } else if (window.UIHelpers) {
            window.UIHelpers.showToast(message, type);
        } else if (window.nasaCoinDashboard) {
            window.nasaCoinDashboard.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Price tracking integration
class PriceTracker {
    constructor() {
        this.prices = {};
        this.priceHistory = [];
        this.updateInterval = null;
    }

    async init() {
        await this.updatePrices();
        this.startPriceUpdates();
    }

    async updatePrices() {
        try {
            // CoinGecko API for price data
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
            const data = await response.json();
            
            this.prices = data;
            this.updatePriceDisplay();
            
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        }
    }

    updatePriceDisplay() {
        const priceContainer = document.getElementById('priceTracker');
        if (!priceContainer) return;
        
        let html = '<div class="price-grid">';
        
        Object.entries(this.prices).forEach(([coin, data]) => {
            const changeClass = data.usd_24h_change >= 0 ? 'positive' : 'negative';
            const changeIcon = data.usd_24h_change >= 0 ? '↗' : '↘';
            
            html += `
                <div class="price-card">
                    <div class="price-coin">${coin.toUpperCase()}</div>
                    <div class="price-value">$${data.usd.toLocaleString()}</div>
                    <div class="price-change ${changeClass}">
                        ${changeIcon} ${Math.abs(data.usd_24h_change).toFixed(2)}%
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        priceContainer.innerHTML = html;
    }

    startPriceUpdates() {
        this.updateInterval = setInterval(() => {
            this.updatePrices();
        }, 60000); // Update every minute
    }

    stopPriceUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WalletIntegration, PriceTracker };
} else {
    window.WalletIntegration = WalletIntegration;
    window.PriceTracker = PriceTracker;
}