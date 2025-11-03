// NASA Coin Trading Features Module

// Import UI helpers if available
if (typeof require !== 'undefined') {
    try {
        const { showToast } = require('./utils/ui-helpers');
        var uiShowToast = showToast;
    } catch (e) {
        // Will use window.UIHelpers in browser
    }
}

class TradingFeatures {
    constructor() {
        this.exchanges = {
            uniswap: 'https://app.uniswap.org/#/swap',
            pancakeswap: 'https://pancakeswap.finance/swap',
            sushiswap: 'https://app.sushi.com/swap'
        };
        
        this.tradingPairs = [];
        this.orderBook = { bids: [], asks: [] };
        this.tradingHistory = [];
        
        this.init();
    }

    async init() {
        this.setupTradingInterface();
        await this.loadTradingData();
    }

    setupTradingInterface() {
        const tradingSection = document.createElement('section');
        tradingSection.className = 'trading-section';
        tradingSection.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-chart-bar"></i> Trading</h2>
                <div class="trading-controls">
                    <select id="tradingPair">
                        <option value="NASAPEPE/ETH">NASAPEPE/ETH</option>
                        <option value="NASAPEPE/USDT">NASAPEPE/USDT</option>
                        <option value="NASAPEPE/BTC">NASAPEPE/BTC</option>
                    </select>
                </div>
            </div>
            
            <div class="trading-content">
                <div class="trading-chart">
                    <div id="tradingViewChart" style="height: 400px;">
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-line"></i>
                            <p>Trading chart will be displayed here</p>
                            <button id="loadChart" class="btn btn-primary">Load TradingView Chart</button>
                        </div>
                    </div>
                </div>
                
                <div class="trading-panel">
                    <div class="order-form">
                        <div class="order-tabs">
                            <button class="tab-btn active" data-tab="buy">Buy</button>
                            <button class="tab-btn" data-tab="sell">Sell</button>
                        </div>
                        
                        <div class="tab-content active" id="buyTab">
                            <div class="form-group">
                                <label>Price (ETH):</label>
                                <input type="number" id="buyPrice" placeholder="0.000001" step="0.000001">
                            </div>
                            <div class="form-group">
                                <label>Amount (NASAPEPE):</label>
                                <input type="number" id="buyAmount" placeholder="1000" step="1">
                            </div>
                            <div class="form-group">
                                <label>Total (ETH):</label>
                                <input type="number" id="buyTotal" readonly>
                            </div>
                            <button id="placeBuyOrder" class="btn btn-success full-width">
                                <i class="fas fa-arrow-up"></i> Place Buy Order
                            </button>
                        </div>
                        
                        <div class="tab-content" id="sellTab">
                            <div class="form-group">
                                <label>Price (ETH):</label>
                                <input type="number" id="sellPrice" placeholder="0.000001" step="0.000001">
                            </div>
                            <div class="form-group">
                                <label>Amount (NASAPEPE):</label>
                                <input type="number" id="sellAmount" placeholder="1000" step="1">
                            </div>
                            <div class="form-group">
                                <label>Total (ETH):</label>
                                <input type="number" id="sellTotal" readonly>
                            </div>
                            <button id="placeSellOrder" class="btn btn-danger full-width">
                                <i class="fas fa-arrow-down"></i> Place Sell Order
                            </button>
                        </div>
                    </div>
                    
                    <div class="order-book">
                        <h4>Order Book</h4>
                        <div class="order-book-content">
                            <div class="asks">
                                <div class="order-book-header">
                                    <span>Price</span>
                                    <span>Amount</span>
                                    <span>Total</span>
                                </div>
                                <div id="asksList"></div>
                            </div>
                            <div class="spread">
                                <span id="spreadValue">Spread: 0.000001 ETH</span>
                            </div>
                            <div class="bids">
                                <div id="bidsList"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dex-links">
                <h4>Trade on DEX</h4>
                <div class="dex-buttons">
                    <a href="#" id="uniswapLink" class="btn btn-outline" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Uniswap
                    </a>
                    <a href="#" id="pancakeswapLink" class="btn btn-outline" target="_blank">
                        <i class="fas fa-external-link-alt"></i> PancakeSwap
                    </a>
                    <a href="#" id="sushiswapLink" class="btn btn-outline" target="_blank">
                        <i class="fas fa-external-link-alt"></i> SushiSwap
                    </a>
                </div>
            </div>
        `;
        
        // Insert after wallet section
        const walletSection = document.querySelector('.wallet-section');
        walletSection.parentNode.insertBefore(tradingSection, walletSection.nextSibling);
        
        this.setupTradingEventListeners();
    }

    setupTradingEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Order form calculations
        document.getElementById('buyPrice')?.addEventListener('input', () => this.calculateBuyTotal());
        document.getElementById('buyAmount')?.addEventListener('input', () => this.calculateBuyTotal());
        document.getElementById('sellPrice')?.addEventListener('input', () => this.calculateSellTotal());
        document.getElementById('sellAmount')?.addEventListener('input', () => this.calculateSellTotal());
        
        // Order placement
        document.getElementById('placeBuyOrder')?.addEventListener('click', () => this.placeBuyOrder());
        document.getElementById('placeSellOrder')?.addEventListener('click', () => this.placeSellOrder());
        
        // Chart loading
        document.getElementById('loadChart')?.addEventListener('click', () => this.loadTradingViewChart());
        
        // DEX links
        document.getElementById('uniswapLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openDEX('uniswap');
        });
        
        document.getElementById('pancakeswapLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openDEX('pancakeswap');
        });
        
        document.getElementById('sushiswapLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openDEX('sushiswap');
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
    }

    calculateBuyTotal() {
        const price = parseFloat(document.getElementById('buyPrice').value) || 0;
        const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
        const total = price * amount;
        document.getElementById('buyTotal').value = total.toFixed(8);
    }

    calculateSellTotal() {
        const price = parseFloat(document.getElementById('sellPrice').value) || 0;
        const amount = parseFloat(document.getElementById('sellAmount').value) || 0;
        const total = price * amount;
        document.getElementById('sellTotal').value = total.toFixed(8);
    }

    async placeBuyOrder() {
        const price = document.getElementById('buyPrice').value;
        const amount = document.getElementById('buyAmount').value;
        
        if (!price || !amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // In a real implementation, this would connect to a DEX or exchange API
        this.showToast('Buy order simulation - would place order on connected exchange', 'info');
        
        // Add to order book simulation
        this.orderBook.bids.push({
            price: parseFloat(price),
            amount: parseFloat(amount),
            total: parseFloat(price) * parseFloat(amount),
            timestamp: Date.now()
        });
        
        this.updateOrderBook();
    }

    async placeSellOrder() {
        const price = document.getElementById('sellPrice').value;
        const amount = document.getElementById('sellAmount').value;
        
        if (!price || !amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // In a real implementation, this would connect to a DEX or exchange API
        this.showToast('Sell order simulation - would place order on connected exchange', 'info');
        
        // Add to order book simulation
        this.orderBook.asks.push({
            price: parseFloat(price),
            amount: parseFloat(amount),
            total: parseFloat(price) * parseFloat(amount),
            timestamp: Date.now()
        });
        
        this.updateOrderBook();
    }

    updateOrderBook() {
        // Sort orders
        this.orderBook.bids.sort((a, b) => b.price - a.price);
        this.orderBook.asks.sort((a, b) => a.price - b.price);
        
        // Update bids display
        const bidsList = document.getElementById('bidsList');
        bidsList.innerHTML = this.orderBook.bids.slice(0, 10).map(bid => `
            <div class="order-row bid">
                <span class="price">${bid.price.toFixed(8)}</span>
                <span class="amount">${bid.amount.toLocaleString()}</span>
                <span class="total">${bid.total.toFixed(8)}</span>
            </div>
        `).join('');
        
        // Update asks display
        const asksList = document.getElementById('asksList');
        asksList.innerHTML = this.orderBook.asks.slice(0, 10).map(ask => `
            <div class="order-row ask">
                <span class="price">${ask.price.toFixed(8)}</span>
                <span class="amount">${ask.amount.toLocaleString()}</span>
                <span class="total">${ask.total.toFixed(8)}</span>
            </div>
        `).join('');
        
        // Update spread
        if (this.orderBook.bids.length > 0 && this.orderBook.asks.length > 0) {
            const spread = this.orderBook.asks[0].price - this.orderBook.bids[0].price;
            document.getElementById('spreadValue').textContent = `Spread: ${spread.toFixed(8)} ETH`;
        }
    }

    loadTradingViewChart() {
        const chartContainer = document.getElementById('tradingViewChart');
        
        // In a real implementation, you would load the TradingView widget
        chartContainer.innerHTML = `
            <div class="chart-loaded">
                <div class="chart-header">
                    <h4>NASAPEPE/ETH Chart</h4>
                    <div class="chart-controls">
                        <button class="btn btn-small">1H</button>
                        <button class="btn btn-small active">4H</button>
                        <button class="btn btn-small">1D</button>
                        <button class="btn btn-small">1W</button>
                    </div>
                </div>
                <div class="chart-placeholder-loaded">
                    <canvas id="priceChart" width="100%" height="300"></canvas>
                    <p>TradingView chart would be embedded here</p>
                    <p>Current Price: 0.000001 ETH</p>
                    <p>24h Change: +5.67%</p>
                </div>
            </div>
        `;
        
        this.showToast('Chart loaded successfully!', 'success');
    }

    openDEX(exchange) {
        const url = this.exchanges[exchange];
        if (url) {
            window.open(url, '_blank');
            this.showToast(`Opening ${exchange}...`, 'info');
        }
    }

    async loadTradingData() {
        // Simulate loading trading data
        setTimeout(() => {
            // Add some sample orders to the order book
            this.orderBook.bids = [
                { price: 0.000001, amount: 50000, total: 0.05, timestamp: Date.now() },
                { price: 0.0000009, amount: 75000, total: 0.0675, timestamp: Date.now() },
                { price: 0.0000008, amount: 100000, total: 0.08, timestamp: Date.now() }
            ];
            
            this.orderBook.asks = [
                { price: 0.0000012, amount: 40000, total: 0.048, timestamp: Date.now() },
                { price: 0.0000013, amount: 60000, total: 0.078, timestamp: Date.now() },
                { price: 0.0000014, amount: 80000, total: 0.112, timestamp: Date.now() }
            ];
            
            this.updateOrderBook();
        }, 1000);
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
    module.exports = TradingFeatures;
} else {
    window.TradingFeatures = TradingFeatures;
}