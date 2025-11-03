// NASA Coin Portfolio Management Module

// Import UI helpers if available
if (typeof require !== 'undefined') {
    try {
        const { showToast, updateElement } = require('./utils/ui-helpers');
        var uiShowToast = showToast;
        var uiUpdateElement = updateElement;
    } catch (e) {
        // Will use window.UIHelpers in browser
    }
}

class PortfolioManagement {
    constructor() {
        this.portfolio = {
            totalValue: 0,
            totalInvested: 0,
            totalGains: 0,
            totalGainsPercent: 0,
            assets: []
        };
        this.transactions = [];
        this.watchlist = [];
        this.performanceData = [];
        this.updateInterval = null;
        
        this.init();
    }

    async init() {
        this.setupPortfolioInterface();
        this.setupEventListeners();
        await this.loadPortfolioData();
        this.startPortfolioUpdates();
    }

    setupPortfolioInterface() {
        const portfolioSection = document.createElement('section');
        portfolioSection.className = 'portfolio-section';
        portfolioSection.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-briefcase"></i> Portfolio Management</h2>
                <div class="portfolio-controls">
                    <button id="addAsset" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Asset
                    </button>
                    <button id="refreshPortfolio" class="btn btn-outline">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="portfolio-content">
                <!-- Portfolio Overview -->
                <div class="portfolio-overview">
                    <div class="overview-card">
                        <div class="overview-header">
                            <h3>Portfolio Value</h3>
                            <span class="portfolio-change" id="portfolioChange">+0.00%</span>
                        </div>
                        <div class="overview-value" id="portfolioValue">$0.00</div>
                        <div class="overview-details">
                            <div class="detail-item">
                                <span class="label">Total Invested:</span>
                                <span class="value" id="totalInvested">$0.00</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Total Gains:</span>
                                <span class="value" id="totalGains">$0.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card">
                        <div class="overview-header">
                            <h3>Performance</h3>
                            <span class="time-range">24H</span>
                        </div>
                        <div class="performance-chart" id="performanceChart">
                            <canvas id="portfolioChart" width="100%" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Asset Allocation -->
                <div class="asset-allocation">
                    <h3><i class="fas fa-chart-pie"></i> Asset Allocation</h3>
                    <div class="allocation-content">
                        <div class="allocation-chart" id="allocationChart">
                            <canvas id="pieChart" width="300" height="300"></canvas>
                        </div>
                        <div class="allocation-list" id="allocationList">
                            <!-- Assets will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Assets Table -->
                <div class="assets-section">
                    <h3><i class="fas fa-coins"></i> Assets</h3>
                    <div class="assets-table-container">
                        <table class="assets-table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Amount</th>
                                    <th>Price</th>
                                    <th>Value</th>
                                    <th>Change 24h</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="assetsTableBody">
                                <!-- Assets will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Transaction History -->
                <div class="transactions-section">
                    <h3><i class="fas fa-history"></i> Transaction History</h3>
                    <div class="transaction-filters">
                        <select id="transactionFilter">
                            <option value="all">All Transactions</option>
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                            <option value="stake">Stake</option>
                            <option value="unstake">Unstake</option>
                            <option value="mining">Mining</option>
                        </select>
                        <input type="date" id="transactionDate" placeholder="Filter by date">
                        <button id="exportTransactions" class="btn btn-outline btn-small">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                    <div class="transactions-list" id="transactionsList">
                        <!-- Transactions will be populated here -->
                    </div>
                </div>

                <!-- Watchlist -->
                <div class="watchlist-section">
                    <h3><i class="fas fa-star"></i> Watchlist</h3>
                    <div class="watchlist-content">
                        <div class="add-to-watchlist">
                            <input type="text" id="watchlistSymbol" placeholder="Enter symbol (e.g., BTC, ETH)">
                            <button id="addToWatchlist" class="btn btn-primary btn-small">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                        <div class="watchlist-items" id="watchlistItems">
                            <!-- Watchlist items will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after staking section
        const stakingSection = document.querySelector('.staking-section');
        if (stakingSection) {
            stakingSection.parentNode.insertBefore(portfolioSection, stakingSection.nextSibling);
        } else {
            // Insert before blockchain section if staking section doesn't exist
            const blockchainSection = document.querySelector('.blockchain-section');
            blockchainSection.parentNode.insertBefore(portfolioSection, blockchainSection);
        }
    }

    setupEventListeners() {
        // Add asset button
        document.getElementById('addAsset')?.addEventListener('click', () => {
            this.showAddAssetModal();
        });
        
        // Refresh portfolio
        document.getElementById('refreshPortfolio')?.addEventListener('click', () => {
            this.refreshPortfolio();
        });
        
        // Transaction filters
        document.getElementById('transactionFilter')?.addEventListener('change', (e) => {
            this.filterTransactions(e.target.value);
        });
        
        document.getElementById('transactionDate')?.addEventListener('change', (e) => {
            this.filterTransactionsByDate(e.target.value);
        });
        
        // Export transactions
        document.getElementById('exportTransactions')?.addEventListener('click', () => {
            this.exportTransactions();
        });
        
        // Watchlist
        document.getElementById('addToWatchlist')?.addEventListener('click', () => {
            this.addToWatchlist();
        });
    }

    async loadPortfolioData() {
        // Simulate loading portfolio data
        this.portfolio.assets = [
            {
                id: 1,
                symbol: 'NASAPEPE',
                name: 'NASA Coin',
                amount: 1000000,
                price: 0.000001,
                value: 1.0,
                change24h: 5.67,
                type: 'crypto',
                source: 'mining'
            },
            {
                id: 2,
                symbol: 'BTC',
                name: 'Bitcoin',
                amount: 0.001,
                price: 45000,
                value: 45.0,
                change24h: -2.34,
                type: 'crypto',
                source: 'purchase'
            },
            {
                id: 3,
                symbol: 'ETH',
                name: 'Ethereum',
                amount: 0.1,
                price: 3000,
                value: 300.0,
                change24h: 3.21,
                type: 'crypto',
                source: 'purchase'
            }
        ];
        
        this.transactions = [
            {
                id: 1,
                type: 'mining',
                symbol: 'NASAPEPE',
                amount: 500000,
                price: 0.000001,
                value: 0.5,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'completed'
            },
            {
                id: 2,
                type: 'buy',
                symbol: 'BTC',
                amount: 0.001,
                price: 45000,
                value: 45.0,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'completed'
            },
            {
                id: 3,
                type: 'stake',
                symbol: 'NASAPEPE',
                amount: 100000,
                price: 0.000001,
                value: 0.1,
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                status: 'completed'
            }
        ];
        
        this.watchlist = [
            { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: -2.34 },
            { symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 3.21 },
            { symbol: 'ADA', name: 'Cardano', price: 0.5, change24h: 1.45 }
        ];
        
        this.calculatePortfolioValue();
        this.renderPortfolio();
        this.renderAssets();
        this.renderTransactions();
        this.renderWatchlist();
        this.createCharts();
    }

    calculatePortfolioValue() {
        this.portfolio.totalValue = this.portfolio.assets.reduce((sum, asset) => sum + asset.value, 0);
        this.portfolio.totalInvested = this.portfolio.assets.reduce((sum, asset) => {
            const transaction = this.transactions.find(t => t.symbol === asset.symbol && t.type === 'buy');
            return sum + (transaction ? transaction.value : 0);
        }, 0);
        this.portfolio.totalGains = this.portfolio.totalValue - this.portfolio.totalInvested;
        this.portfolio.totalGainsPercent = this.portfolio.totalInvested > 0 ? 
            (this.portfolio.totalGains / this.portfolio.totalInvested) * 100 : 0;
    }

    renderPortfolio() {
        this.updateElement('portfolioValue', '$' + this.portfolio.totalValue.toFixed(2));
        this.updateElement('totalInvested', '$' + this.portfolio.totalInvested.toFixed(2));
        this.updateElement('totalGains', '$' + this.portfolio.totalGains.toFixed(2));
        
        const changeElement = document.getElementById('portfolioChange');
        if (changeElement) {
            changeElement.textContent = (this.portfolio.totalGainsPercent >= 0 ? '+' : '') + 
                this.portfolio.totalGainsPercent.toFixed(2) + '%';
            changeElement.className = 'portfolio-change ' + 
                (this.portfolio.totalGainsPercent >= 0 ? 'positive' : 'negative');
        }
    }

    renderAssets() {
        const tableBody = document.getElementById('assetsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = this.portfolio.assets.map(asset => `
            <tr>
                <td>
                    <div class="asset-info">
                        <span class="asset-symbol">${asset.symbol}</span>
                        <span class="asset-name">${asset.name}</span>
                    </div>
                </td>
                <td>${asset.amount.toLocaleString()}</td>
                <td>$${asset.price.toFixed(6)}</td>
                <td>$${asset.value.toFixed(2)}</td>
                <td>
                    <span class="change ${asset.change24h >= 0 ? 'positive' : 'negative'}">
                        ${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%
                    </span>
                </td>
                <td>
                    <div class="asset-actions">
                        <button class="btn btn-outline btn-small" onclick="portfolioManagement.editAsset(${asset.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-small" onclick="portfolioManagement.removeAsset(${asset.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.renderAllocationList();
    }

    renderAllocationList() {
        const allocationList = document.getElementById('allocationList');
        if (!allocationList) return;
        
        allocationList.innerHTML = this.portfolio.assets.map(asset => {
            const percentage = (asset.value / this.portfolio.totalValue) * 100;
            return `
                <div class="allocation-item">
                    <div class="allocation-info">
                        <span class="asset-symbol">${asset.symbol}</span>
                        <span class="asset-percentage">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="allocation-bar">
                        <div class="allocation-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="allocation-value">$${asset.value.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    renderTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;
        
        const filteredTransactions = this.getFilteredTransactions();
        
        transactionsList.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-type">${transaction.type.toUpperCase()}</span>
                        <span class="transaction-symbol">${transaction.symbol}</span>
                        <span class="transaction-date">${transaction.date.toLocaleDateString()}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-amount">${transaction.amount.toLocaleString()} ${transaction.symbol}</span>
                        <span class="transaction-value">$${transaction.value.toFixed(2)}</span>
                        <span class="transaction-status ${transaction.status}">${transaction.status}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderWatchlist() {
        const watchlistItems = document.getElementById('watchlistItems');
        if (!watchlistItems) return;
        
        watchlistItems.innerHTML = this.watchlist.map(item => `
            <div class="watchlist-item">
                <div class="watchlist-info">
                    <span class="watchlist-symbol">${item.symbol}</span>
                    <span class="watchlist-name">${item.name}</span>
                </div>
                <div class="watchlist-price">
                    <span class="price">$${item.price.toLocaleString()}</span>
                    <span class="change ${item.change24h >= 0 ? 'positive' : 'negative'}">
                        ${item.change24h >= 0 ? '+' : ''}${item.change24h.toFixed(2)}%
                    </span>
                </div>
                <button class="btn btn-danger btn-small" onclick="portfolioManagement.removeFromWatchlist('${item.symbol}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    createCharts() {
        this.createPortfolioChart();
        this.createPieChart();
    }

    createPortfolioChart() {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;
        
        // Generate sample performance data
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            data.push(this.portfolio.totalValue + (Math.random() - 0.5) * 10);
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data,
                    borderColor: '#ff6f00',
                    backgroundColor: '#ff6f0020',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    createPieChart() {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        const labels = this.portfolio.assets.map(asset => asset.symbol);
        const data = this.portfolio.assets.map(asset => asset.value);
        const colors = ['#ff6f00', '#3949ab', '#4caf50', '#f44336', '#ff9800'];
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    getFilteredTransactions() {
        const filter = document.getElementById('transactionFilter')?.value || 'all';
        const dateFilter = document.getElementById('transactionDate')?.value;
        
        let filtered = this.transactions;
        
        if (filter !== 'all') {
            filtered = filtered.filter(t => t.type === filter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(t => 
                t.date.toDateString() === filterDate.toDateString()
            );
        }
        
        return filtered.sort((a, b) => b.date - a.date);
    }

    getTransactionIcon(type) {
        const icons = {
            buy: 'arrow-up',
            sell: 'arrow-down',
            stake: 'gem',
            unstake: 'times',
            mining: 'hammer'
        };
        return icons[type] || 'circle';
    }

    showAddAssetModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Add Asset</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Symbol:</label>
                        <input type="text" id="assetSymbol" placeholder="e.g., BTC, ETH">
                    </div>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" id="assetName" placeholder="e.g., Bitcoin, Ethereum">
                    </div>
                    <div class="form-group">
                        <label>Amount:</label>
                        <input type="number" id="assetAmount" placeholder="0.0" step="0.000001">
                    </div>
                    <div class="form-group">
                        <label>Price (USD):</label>
                        <input type="number" id="assetPrice" placeholder="0.00" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Source:</label>
                        <select id="assetSource">
                            <option value="purchase">Purchase</option>
                            <option value="mining">Mining</option>
                            <option value="stake">Staking</option>
                            <option value="gift">Gift</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="addAssetBtn" class="btn btn-primary">Add Asset</button>
                    <button id="cancelAddAsset" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancelAddAsset').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#addAssetBtn').addEventListener('click', () => {
            this.addAsset();
            document.body.removeChild(modal);
        });
    }

    addAsset() {
        const symbol = document.getElementById('assetSymbol').value;
        const name = document.getElementById('assetName').value;
        const amount = parseFloat(document.getElementById('assetAmount').value);
        const price = parseFloat(document.getElementById('assetPrice').value);
        const source = document.getElementById('assetSource').value;
        
        if (!symbol || !name || !amount || !price) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const newAsset = {
            id: this.portfolio.assets.length + 1,
            symbol: symbol.toUpperCase(),
            name: name,
            amount: amount,
            price: price,
            value: amount * price,
            change24h: 0,
            type: 'crypto',
            source: source
        };
        
        this.portfolio.assets.push(newAsset);
        
        // Add transaction
        const newTransaction = {
            id: this.transactions.length + 1,
            type: source === 'mining' ? 'mining' : 'buy',
            symbol: symbol.toUpperCase(),
            amount: amount,
            price: price,
            value: amount * price,
            date: new Date(),
            status: 'completed'
        };
        
        this.transactions.push(newTransaction);
        
        this.calculatePortfolioValue();
        this.renderPortfolio();
        this.renderAssets();
        this.renderTransactions();
        this.createCharts();
        
        this.showToast('Asset added successfully!', 'success');
    }

    editAsset(assetId) {
        const asset = this.portfolio.assets.find(a => a.id === assetId);
        if (!asset) return;
        
        // Simple edit - just update amount
        const newAmount = prompt(`Enter new amount for ${asset.symbol}:`, asset.amount);
        if (newAmount && !isNaN(newAmount)) {
            asset.amount = parseFloat(newAmount);
            asset.value = asset.amount * asset.price;
            this.calculatePortfolioValue();
            this.renderPortfolio();
            this.renderAssets();
            this.createCharts();
            this.showToast('Asset updated successfully!', 'success');
        }
    }

    removeAsset(assetId) {
        if (confirm('Are you sure you want to remove this asset?')) {
            this.portfolio.assets = this.portfolio.assets.filter(a => a.id !== assetId);
            this.calculatePortfolioValue();
            this.renderPortfolio();
            this.renderAssets();
            this.createCharts();
            this.showToast('Asset removed successfully!', 'success');
        }
    }

    addToWatchlist() {
        const symbol = document.getElementById('watchlistSymbol').value.toUpperCase();
        if (!symbol) {
            this.showToast('Please enter a symbol', 'error');
            return;
        }
        
        if (this.watchlist.find(item => item.symbol === symbol)) {
            this.showToast('Asset already in watchlist', 'warning');
            return;
        }
        
        // Simulate fetching price data
        const price = Math.random() * 1000 + 100;
        const change24h = (Math.random() - 0.5) * 10;
        
        this.watchlist.push({
            symbol: symbol,
            name: symbol,
            price: price,
            change24h: change24h
        });
        
        this.renderWatchlist();
        document.getElementById('watchlistSymbol').value = '';
        this.showToast(`${symbol} added to watchlist!`, 'success');
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
        this.renderWatchlist();
        this.showToast(`${symbol} removed from watchlist!`, 'success');
    }

    filterTransactions(type) {
        this.renderTransactions();
    }

    filterTransactionsByDate(date) {
        this.renderTransactions();
    }

    exportTransactions() {
        const data = {
            timestamp: new Date().toISOString(),
            transactions: this.transactions,
            portfolio: this.portfolio
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nasacoin-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Portfolio data exported successfully!', 'success');
    }

    refreshPortfolio() {
        // Simulate refreshing portfolio data
        this.portfolio.assets.forEach(asset => {
            asset.price += (Math.random() - 0.5) * asset.price * 0.1;
            asset.value = asset.amount * asset.price;
            asset.change24h = (Math.random() - 0.5) * 10;
        });
        
        this.calculatePortfolioValue();
        this.renderPortfolio();
        this.renderAssets();
        this.createCharts();
        this.showToast('Portfolio refreshed!', 'success');
    }

    startPortfolioUpdates() {
        this.updateInterval = setInterval(() => {
            this.refreshPortfolio();
        }, 300000); // Update every 5 minutes
    }

    updateElement(id, value) {
        // Use the UIHelpers utility if available
        if (typeof uiUpdateElement === 'function') {
            uiUpdateElement(id, value);
        } else if (window.UIHelpers) {
            window.UIHelpers.updateElement(id, value);
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
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

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManagement;
} else {
    window.PortfolioManagement = PortfolioManagement;
}