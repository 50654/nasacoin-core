// NASA Coin Enhanced Features Module
class EnhancedFeatures {
    constructor() {
        this.charts = {};
        this.alerts = [];
        this.notifications = [];
        this.miningData = [];
        this.priceData = [];
        this.miningStartTime = null;
        this.alertId = 0;
        
        this.init();
    }

    async init() {
        this.setupCharts();
        this.setupAlerts();
        this.setupEnhancedMining();
        this.setupAdvancedWallet();
        this.startDataCollection();
    }

    // ==================== CHART MANAGEMENT ====================
    setupCharts() {
        // Mining Performance Chart
        const miningCtx = document.getElementById('miningChart');
        if (miningCtx) {
            this.charts.mining = new Chart(miningCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Hash Rate (H/s)',
                        data: [],
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'CPU Usage (%)',
                        data: [],
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#ffffff' }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'minute' },
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: '#ffffff' },
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            });
        }

        // Price Chart
        const priceCtx = document.getElementById('priceChart');
        if (priceCtx) {
            this.charts.price = new Chart(priceCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'NASAPEPE Price ($)',
                        data: [],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#ffffff' }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'hour' },
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                color: '#ffffff',
                                callback: function(value) {
                                    return '$' + value.toFixed(8);
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }

        // Setup chart control buttons
        this.setupChartControls();
    }

    setupChartControls() {
        // Mining chart controls
        document.querySelectorAll('.chart-btn[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn[data-period]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateMiningChartPeriod(e.target.dataset.period);
            });
        });

        // Price chart controls
        document.querySelectorAll('.chart-btn[data-timeframe]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn[data-timeframe]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updatePriceChartTimeframe(e.target.dataset.timeframe);
            });
        });
    }

    updateMiningChartPeriod(period) {
        const periodMinutes = {
            '1h': 60,
            '6h': 360,
            '24h': 1440,
            '7d': 10080
        };

        const minutes = periodMinutes[period] || 60;
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        
        const filteredData = this.miningData.filter(d => new Date(d.timestamp) > cutoffTime);
        
        if (this.charts.mining) {
            this.charts.mining.data.labels = filteredData.map(d => d.timestamp);
            this.charts.mining.data.datasets[0].data = filteredData.map(d => d.hashRate);
            this.charts.mining.data.datasets[1].data = filteredData.map(d => d.cpuUsage);
            this.charts.mining.update();
        }
    }

    updatePriceChartTimeframe(timeframe) {
        // This would typically fetch data from an API
        // For now, we'll generate sample data
        this.generateSamplePriceData(timeframe);
    }

    generateSamplePriceData(timeframe) {
        const now = new Date();
        const data = [];
        const intervals = {
            '1h': { count: 60, interval: 1 },
            '4h': { count: 48, interval: 5 },
            '1d': { count: 24, interval: 60 },
            '1w': { count: 168, interval: 60 },
            '1m': { count: 720, interval: 60 }
        };

        const config = intervals[timeframe] || intervals['1h'];
        let basePrice = 0.000001;

        for (let i = config.count; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * config.interval * 60 * 1000);
            const volatility = (Math.random() - 0.5) * 0.1;
            basePrice = Math.max(0.0000001, basePrice * (1 + volatility));
            
            data.push({
                timestamp: timestamp,
                price: basePrice
            });
        }

        if (this.charts.price) {
            this.charts.price.data.labels = data.map(d => d.timestamp);
            this.charts.price.data.datasets[0].data = data.map(d => d.price);
            this.charts.price.update();
        }
    }

    // ==================== ENHANCED MINING ====================
    setupEnhancedMining() {
        // Auto mining toggle
        document.getElementById('autoMining')?.addEventListener('click', () => {
            this.toggleAutoMining();
        });

        // Mining intensity change
        document.getElementById('miningIntensity')?.addEventListener('change', (e) => {
            this.updateMiningIntensity(e.target.value);
        });

        // Pool selection
        document.getElementById('miningPool')?.addEventListener('change', (e) => {
            this.updateMiningPool(e.target.value);
        });

        // Start mining timer when mining begins
        this.setupMiningTimer();
    }

    toggleAutoMining() {
        const autoBtn = document.getElementById('autoMining');
        const isActive = autoBtn.classList.contains('active');
        
        if (isActive) {
            autoBtn.classList.remove('active');
            autoBtn.innerHTML = '<i class="fas fa-robot"></i> Auto Mode';
            this.stopAutoMining();
        } else {
            autoBtn.classList.add('active');
            autoBtn.innerHTML = '<i class="fas fa-robot"></i> Auto Active';
            this.startAutoMining();
        }
    }

    startAutoMining() {
        // Auto mining logic - adjust based on system performance
        this.autoMiningInterval = setInterval(() => {
            const cpuUsage = this.getCurrentCPUUsage();
            const threads = document.getElementById('threads').value;
            
            if (cpuUsage < 70 && threads < 8) {
                // Increase threads if CPU usage is low
                document.getElementById('threads').value = Math.min(8, parseInt(threads) + 1);
            } else if (cpuUsage > 90 && threads > 1) {
                // Decrease threads if CPU usage is too high
                document.getElementById('threads').value = Math.max(1, parseInt(threads) - 1);
            }
        }, 30000); // Check every 30 seconds
    }

    stopAutoMining() {
        if (this.autoMiningInterval) {
            clearInterval(this.autoMiningInterval);
            this.autoMiningInterval = null;
        }
    }

    updateMiningIntensity(intensity) {
        const intensityMap = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'maximum': 100
        };
        
        const percentage = intensityMap[intensity] || 50;
        // This would typically adjust the mining algorithm parameters
        console.log(`Mining intensity set to ${percentage}%`);
    }

    updateMiningPool(pool) {
        const poolStats = document.getElementById('poolStats');
        
        switch(pool) {
            case 'nasapool':
                this.updatePoolStats('2.5 TH/s', '1,234', '0.05');
                break;
            case 'spacepool':
                this.updatePoolStats('1.8 TH/s', '892', '0.07');
                break;
            case 'custom':
                this.showCustomPoolDialog();
                break;
            default:
                this.updatePoolStats('-', '-', '100');
        }
    }

    updatePoolStats(hashRate, workers, share) {
        document.getElementById('poolHashRate').textContent = hashRate;
        document.getElementById('poolWorkers').textContent = workers;
        document.getElementById('yourShare').textContent = share + '%';
    }

    setupMiningTimer() {
        setInterval(() => {
            if (this.miningStartTime) {
                const elapsed = Date.now() - this.miningStartTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                
                document.getElementById('miningTime').textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    startMiningTimer() {
        this.miningStartTime = Date.now();
    }

    stopMiningTimer() {
        this.miningStartTime = null;
        document.getElementById('miningTime').textContent = '00:00:00';
    }

    getCurrentCPUUsage() {
        // Simulate CPU usage - in a real implementation, this would get actual system data
        return Math.random() * 100;
    }

    // ==================== ADVANCED WALLET ====================
    setupAdvancedWallet() {
        // QR Code generation
        document.getElementById('qrCode')?.addEventListener('click', () => {
            this.generateQRCode();
        });

        // Wallet action buttons
        document.getElementById('sendTokens')?.addEventListener('click', () => {
            this.showSendModal();
        });

        document.getElementById('receiveTokens')?.addEventListener('click', () => {
            this.showReceiveModal();
        });

        document.getElementById('swapTokens')?.addEventListener('click', () => {
            this.showSwapModal();
        });

        document.getElementById('stakeTokens')?.addEventListener('click', () => {
            this.showStakeModal();
        });

        document.getElementById('refreshBalance')?.addEventListener('click', () => {
            this.refreshWalletBalance();
        });

        // Additional wallet providers
        this.setupAdditionalWallets();
    }

    setupAdditionalWallets() {
        document.getElementById('connectWalletConnect')?.addEventListener('click', () => {
            this.connectWalletConnect();
        });

        document.getElementById('connectTrustWallet')?.addEventListener('click', () => {
            this.connectTrustWallet();
        });

        document.getElementById('connectPhantom')?.addEventListener('click', () => {
            this.connectPhantom();
        });

        document.getElementById('connectLedger')?.addEventListener('click', () => {
            this.connectLedger();
        });
    }

    async connectWalletConnect() {
        try {
            if (typeof WalletConnectProvider !== 'undefined') {
                const provider = new WalletConnectProvider({
                    infuraId: "your-infura-id" // You'd need to set this up
                });
                
                await provider.enable();
                this.handleWalletConnection(provider, 'WalletConnect');
            } else {
                this.showToast('WalletConnect not available', 'error');
            }
        } catch (error) {
            console.error('WalletConnect connection failed:', error);
            this.showToast('Failed to connect WalletConnect', 'error');
        }
    }

    async connectTrustWallet() {
        if (window.trustWallet) {
            try {
                const accounts = await window.trustWallet.request({ method: 'eth_requestAccounts' });
                this.handleWalletConnection(window.trustWallet, 'Trust Wallet');
            } catch (error) {
                this.showToast('Failed to connect Trust Wallet', 'error');
            }
        } else {
            this.showToast('Trust Wallet not detected', 'error');
        }
    }

    async connectPhantom() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                this.handleWalletConnection(window.solana, 'Phantom');
            } catch (error) {
                this.showToast('Failed to connect Phantom', 'error');
            }
        } else {
            this.showToast('Phantom wallet not detected', 'error');
        }
    }

    async connectLedger() {
        this.showToast('Ledger integration coming soon!', 'info');
    }

    generateQRCode() {
        const address = document.getElementById('walletAddress').value;
        if (address) {
            QRCode.toCanvas(document.createElement('canvas'), address, (error, canvas) => {
                if (!error) {
                    this.showQRModal(canvas);
                }
            });
        }
    }

    showQRModal(canvas) {
        // Create and show QR code modal
        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-header">
                    <h3>Wallet Address QR Code</h3>
                    <button class="close-qr">&times;</button>
                </div>
                <div class="qr-body">
                    <div class="qr-canvas-container"></div>
                    <p>Scan this QR code to get the wallet address</p>
                </div>
            </div>
        `;
        
        modal.querySelector('.qr-canvas-container').appendChild(canvas);
        document.body.appendChild(modal);
        
        modal.querySelector('.close-qr').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // ==================== ALERTS SYSTEM ====================
    setupAlerts() {
        document.getElementById('createAlert')?.addEventListener('click', () => {
            this.showCreateAlertModal();
        });

        // Load saved alerts
        this.loadSavedAlerts();
    }

    showCreateAlertModal() {
        const modal = document.createElement('div');
        modal.className = 'alert-modal';
        modal.innerHTML = `
            <div class="alert-modal-content">
                <div class="alert-header">
                    <h3>Create New Alert</h3>
                    <button class="close-alert">&times;</button>
                </div>
                <div class="alert-body">
                    <div class="alert-form">
                        <div class="form-group">
                            <label>Alert Type:</label>
                            <select id="alertType">
                                <option value="price">Price Alert</option>
                                <option value="mining">Mining Alert</option>
                                <option value="wallet">Wallet Alert</option>
                                <option value="network">Network Alert</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Condition:</label>
                            <select id="alertCondition">
                                <option value="above">Above</option>
                                <option value="below">Below</option>
                                <option value="equals">Equals</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Value:</label>
                            <input type="number" id="alertValue" step="0.00000001" placeholder="Enter value">
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <input type="text" id="alertMessage" placeholder="Alert message">
                        </div>
                        <div class="form-actions">
                            <button id="saveAlert" class="btn btn-primary">Create Alert</button>
                            <button id="cancelAlert" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#saveAlert').addEventListener('click', () => {
            this.createAlert();
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancelAlert').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.close-alert').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    createAlert() {
        const type = document.getElementById('alertType').value;
        const condition = document.getElementById('alertCondition').value;
        const value = parseFloat(document.getElementById('alertValue').value);
        const message = document.getElementById('alertMessage').value;
        
        if (isNaN(value) || !message) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        const alert = {
            id: ++this.alertId,
            type,
            condition,
            value,
            message,
            active: true,
            created: new Date()
        };
        
        this.alerts.push(alert);
        this.updateAlertsDisplay();
        this.saveAlertsToStorage();
        this.showToast('Alert created successfully!', 'success');
    }

    updateAlertsDisplay() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;
        
        if (this.alerts.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">No active alerts. Create your first alert above!</div>';
            return;
        }
        
        alertsList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item" data-id="${alert.id}">
                <div class="alert-icon">
                    <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.message}</div>
                    <div class="alert-details">
                        ${alert.type} ${alert.condition} ${alert.value}
                    </div>
                    <div class="alert-time">Created: ${alert.created.toLocaleString()}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-small btn-danger" onclick="enhancedFeatures.removeAlert(${alert.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update alert counts
        const counts = this.alerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
        }, {});
        
        document.getElementById('priceAlertsCount').textContent = counts.price || 0;
        document.getElementById('miningAlertsCount').textContent = counts.mining || 0;
        document.getElementById('walletAlertsCount').textContent = counts.wallet || 0;
        document.getElementById('networkAlertsCount').textContent = counts.network || 0;
    }

    getAlertIcon(type) {
        const icons = {
            price: 'chart-line',
            mining: 'hammer',
            wallet: 'wallet',
            network: 'network-wired'
        };
        return icons[type] || 'bell';
    }

    removeAlert(id) {
        this.alerts = this.alerts.filter(alert => alert.id !== id);
        this.updateAlertsDisplay();
        this.saveAlertsToStorage();
        this.showToast('Alert removed', 'info');
    }

    checkAlerts() {
        // This would be called periodically to check if any alerts should trigger
        // Implementation would depend on the specific alert types and current values
    }

    // ==================== DATA COLLECTION ====================
    startDataCollection() {
        // Collect mining data every 10 seconds
        setInterval(() => {
            if (this.miningStartTime) {
                const now = new Date();
                const hashRate = Math.random() * 1000000; // Simulate hash rate
                const cpuUsage = this.getCurrentCPUUsage();
                
                this.miningData.push({
                    timestamp: now,
                    hashRate: hashRate,
                    cpuUsage: cpuUsage
                });
                
                // Keep only last 1000 data points
                if (this.miningData.length > 1000) {
                    this.miningData.shift();
                }
                
                // Update charts
                this.updateMiningChart();
                this.updateMiningStats(hashRate, cpuUsage);
            }
        }, 10000);
        
        // Update price data every 30 seconds
        setInterval(() => {
            this.updatePriceData();
        }, 30000);
    }

    updateMiningChart() {
        if (this.charts.mining && this.miningData.length > 0) {
            const recentData = this.miningData.slice(-60); // Last 60 data points
            this.charts.mining.data.labels = recentData.map(d => d.timestamp);
            this.charts.mining.data.datasets[0].data = recentData.map(d => d.hashRate);
            this.charts.mining.data.datasets[1].data = recentData.map(d => d.cpuUsage);
            this.charts.mining.update('none');
        }
    }

    updateMiningStats(hashRate, cpuUsage) {
        // Update hash rate
        document.getElementById('hashRate').textContent = this.formatHashRate(hashRate);
        
        // Update CPU usage
        document.getElementById('cpuUsage').textContent = `CPU: ${cpuUsage.toFixed(1)}%`;
        
        // Update efficiency (simplified calculation)
        const efficiency = Math.min(100, (hashRate / 1000000) * 100);
        document.getElementById('miningEfficiency').textContent = efficiency.toFixed(1) + '%';
        
        // Update trends
        if (this.miningData.length > 1) {
            const prev = this.miningData[this.miningData.length - 2];
            const change = ((hashRate - prev.hashRate) / prev.hashRate * 100);
            document.getElementById('hashRateTrend').textContent = 
                (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
        }
    }

    formatHashRate(hashRate) {
        if (hashRate >= 1000000000) {
            return (hashRate / 1000000000).toFixed(2) + ' GH/s';
        } else if (hashRate >= 1000000) {
            return (hashRate / 1000000).toFixed(2) + ' MH/s';
        } else if (hashRate >= 1000) {
            return (hashRate / 1000).toFixed(2) + ' KH/s';
        } else {
            return hashRate.toFixed(0) + ' H/s';
        }
    }

    updatePriceData() {
        // Simulate price updates
        const currentPrice = 0.000001 + (Math.random() - 0.5) * 0.0000002;
        document.getElementById('nasapepePrice').textContent = '$' + currentPrice.toFixed(8);
        
        // Update comparison prices
        this.updateComparisonPrices();
    }

    updateComparisonPrices() {
        // These would typically come from a real API
        const prices = {
            btc: 45000 + (Math.random() - 0.5) * 2000,
            eth: 3000 + (Math.random() - 0.5) * 200,
            doge: 0.08 + (Math.random() - 0.5) * 0.02
        };
        
        document.getElementById('btcPrice').textContent = '$' + prices.btc.toLocaleString();
        document.getElementById('ethPrice').textContent = '$' + prices.eth.toLocaleString();
        document.getElementById('dogePrice').textContent = '$' + prices.doge.toFixed(4);
    }

    // ==================== UTILITY METHODS ====================
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }

    saveAlertsToStorage() {
        localStorage.setItem('nasacoin_alerts', JSON.stringify(this.alerts));
    }

    loadSavedAlerts() {
        const saved = localStorage.getItem('nasacoin_alerts');
        if (saved) {
            this.alerts = JSON.parse(saved);
            this.alertId = Math.max(...this.alerts.map(a => a.id), 0);
            this.updateAlertsDisplay();
        }
    }

    // Modal methods
    showSendModal() {
        this.showToast('Send feature coming soon!', 'info');
    }

    showReceiveModal() {
        this.generateQRCode();
    }

    showSwapModal() {
        this.showToast('Swap feature coming soon!', 'info');
    }

    showStakeModal() {
        this.showToast('Staking feature coming soon!', 'info');
    }

    refreshWalletBalance() {
        this.showToast('Refreshing wallet balance...', 'info');
        // This would trigger a balance refresh in the wallet integration
    }

    showCustomPoolDialog() {
        const url = prompt('Enter custom pool URL:');
        if (url) {
            this.updatePoolStats('Custom', '?', '?');
            this.showToast('Custom pool configured', 'success');
        }
    }
}

// Initialize enhanced features when DOM is loaded
let enhancedFeatures;
document.addEventListener('DOMContentLoaded', () => {
    enhancedFeatures = new EnhancedFeatures();
});

