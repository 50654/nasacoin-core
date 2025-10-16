// NASA Coin Analytics Dashboard Module
class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.metrics = {
            hashRate: [],
            difficulty: [],
            blockTime: [],
            networkSize: [],
            priceHistory: []
        };
        this.updateInterval = null;
        this.chartColors = {
            primary: '#ff6f00',
            secondary: '#3949ab',
            success: '#4caf50',
            danger: '#f44336',
            warning: '#ff9800'
        };
        
        this.init();
    }

    async init() {
        this.setupAnalyticsInterface();
        this.setupEventListeners();
        await this.loadChartLibrary();
        this.initializeCharts();
        this.startDataCollection();
    }

    setupAnalyticsInterface() {
        const analyticsSection = document.createElement('section');
        analyticsSection.className = 'analytics-section';
        analyticsSection.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-chart-pie"></i> Advanced Analytics</h2>
                <div class="analytics-controls">
                    <select id="timeRange">
                        <option value="1h">Last Hour</option>
                        <option value="24h" selected>Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                    <button id="exportData" class="btn btn-outline">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
            
            <div class="analytics-grid">
                <!-- Performance Metrics -->
                <div class="metrics-card">
                    <h3><i class="fas fa-tachometer-alt"></i> Performance Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-label">Hash Rate Trend</div>
                            <div class="metric-value" id="hashRateTrend">+5.2%</div>
                            <div class="metric-chart" id="hashRateMiniChart"></div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Block Time Avg</div>
                            <div class="metric-value" id="blockTimeAvg">2.5 min</div>
                            <div class="metric-chart" id="blockTimeMiniChart"></div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Network Health</div>
                            <div class="metric-value" id="networkHealth">98.5%</div>
                            <div class="metric-chart" id="networkHealthMiniChart"></div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Mining Efficiency</div>
                            <div class="metric-value" id="miningEfficiency">87.3%</div>
                            <div class="metric-chart" id="miningEfficiencyMiniChart"></div>
                        </div>
                    </div>
                </div>

                <!-- Hash Rate Chart -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-line"></i> Hash Rate Over Time</h3>
                    <div class="chart-container">
                        <canvas id="hashRateChart" width="100%" height="300"></canvas>
                    </div>
                </div>

                <!-- Difficulty Chart -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-area"></i> Network Difficulty</h3>
                    <div class="chart-container">
                        <canvas id="difficultyChart" width="100%" height="300"></canvas>
                    </div>
                </div>

                <!-- Block Time Distribution -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-bar"></i> Block Time Distribution</h3>
                    <div class="chart-container">
                        <canvas id="blockTimeChart" width="100%" height="300"></canvas>
                    </div>
                </div>

                <!-- Network Activity -->
                <div class="chart-card">
                    <h3><i class="fas fa-network-wired"></i> Network Activity</h3>
                    <div class="chart-container">
                        <canvas id="networkActivityChart" width="100%" height="300"></canvas>
                    </div>
                </div>

                <!-- Mining Statistics -->
                <div class="stats-card">
                    <h3><i class="fas fa-hammer"></i> Mining Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Total Mined</div>
                                <div class="stat-value" id="totalMined">0 NASAPEPE</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Mining Time</div>
                                <div class="stat-value" id="miningTime">0h 0m</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-bolt"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Avg Hash Rate</div>
                                <div class="stat-value" id="avgHashRate">0 H/s</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Success Rate</div>
                                <div class="stat-value" id="successRate">0%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Price Analysis -->
                <div class="chart-card">
                    <h3><i class="fas fa-dollar-sign"></i> Price Analysis</h3>
                    <div class="chart-container">
                        <canvas id="priceChart" width="100%" height="300"></canvas>
                    </div>
                    <div class="price-indicators">
                        <div class="indicator">
                            <span class="indicator-label">24h Change:</span>
                            <span class="indicator-value positive" id="priceChange24h">+5.67%</span>
                        </div>
                        <div class="indicator">
                            <span class="indicator-label">7d Change:</span>
                            <span class="indicator-value negative" id="priceChange7d">-2.34%</span>
                        </div>
                        <div class="indicator">
                            <span class="indicator-label">Volume:</span>
                            <span class="indicator-value" id="tradingVolume">1.2M NASAPEPE</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after trading section
        const tradingSection = document.querySelector('.trading-section');
        if (tradingSection) {
            tradingSection.parentNode.insertBefore(analyticsSection, tradingSection.nextSibling);
        } else {
            // Insert before blockchain section if trading section doesn't exist
            const blockchainSection = document.querySelector('.blockchain-section');
            blockchainSection.parentNode.insertBefore(analyticsSection, blockchainSection);
        }
    }

    setupEventListeners() {
        // Time range selector
        document.getElementById('timeRange')?.addEventListener('change', (e) => {
            this.updateTimeRange(e.target.value);
        });
        
        // Export data button
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportAnalyticsData();
        });
    }

    async loadChartLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeCharts() {
        this.createHashRateChart();
        this.createDifficultyChart();
        this.createBlockTimeChart();
        this.createNetworkActivityChart();
        this.createPriceChart();
        this.createMiniCharts();
    }

    createHashRateChart() {
        const ctx = document.getElementById('hashRateChart');
        if (!ctx) return;
        
        this.charts.hashRate = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'Hash Rate (H/s)',
                    data: this.generateSampleData(24, 1000000, 2000000),
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '20',
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
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0',
                            callback: function(value) {
                                return value >= 1e6 ? (value / 1e6).toFixed(1) + 'M' : 
                                       value >= 1e3 ? (value / 1e3).toFixed(1) + 'K' : value;
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                }
            }
        });
    }

    createDifficultyChart() {
        const ctx = document.getElementById('difficultyChart');
        if (!ctx) return;
        
        this.charts.difficulty = new Chart(ctx, {
            type: 'area',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'Difficulty',
                    data: this.generateSampleData(24, 1000, 5000),
                    borderColor: this.chartColors.secondary,
                    backgroundColor: this.chartColors.secondary + '20',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                }
            }
        });
    }

    createBlockTimeChart() {
        const ctx = document.getElementById('blockTimeChart');
        if (!ctx) return;
        
        this.charts.blockTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-1min', '1-2min', '2-3min', '3-4min', '4-5min', '5+min'],
                datasets: [{
                    label: 'Block Count',
                    data: [45, 120, 85, 30, 15, 5],
                    backgroundColor: [
                        this.chartColors.success + '80',
                        this.chartColors.primary + '80',
                        this.chartColors.warning + '80',
                        this.chartColors.danger + '80',
                        this.chartColors.secondary + '80',
                        '#66666680'
                    ],
                    borderColor: [
                        this.chartColors.success,
                        this.chartColors.primary,
                        this.chartColors.warning,
                        this.chartColors.danger,
                        this.chartColors.secondary,
                        '#666666'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                }
            }
        });
    }

    createNetworkActivityChart() {
        const ctx = document.getElementById('networkActivityChart');
        if (!ctx) return;
        
        this.charts.networkActivity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Active Miners', 'Connected Nodes', 'Pending Transactions', 'Mempool Size'],
                datasets: [{
                    data: [35, 45, 15, 5],
                    backgroundColor: [
                        this.chartColors.primary,
                        this.chartColors.success,
                        this.chartColors.warning,
                        this.chartColors.danger
                    ],
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

    createPriceChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;
        
        this.charts.price = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'Price (USD)',
                    data: this.generateSampleData(24, 0.000001, 0.000002),
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '20',
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
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#b0b0b0',
                            callback: function(value) {
                                return '$' + value.toFixed(6);
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                }
            }
        });
    }

    createMiniCharts() {
        // Create mini charts for metrics cards
        this.createMiniChart('hashRateMiniChart', [1, 2, 1.5, 2.5, 2.2, 2.8, 2.1]);
        this.createMiniChart('blockTimeMiniChart', [2.1, 2.3, 2.0, 2.5, 2.2, 2.4, 2.1]);
        this.createMiniChart('networkHealthMiniChart', [98, 97, 99, 98, 99, 98, 98.5]);
        this.createMiniChart('miningEfficiencyMiniChart', [85, 87, 86, 88, 87, 89, 87.3]);
    }

    createMiniChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(data.length).fill(''),
                datasets: [{
                    data: data,
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '20',
                    borderWidth: 1,
                    pointRadius: 0,
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
                        display: false
                    }
                }
            }
        });
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }
        return labels;
    }

    generateSampleData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.random() * (max - min) + min);
        }
        return data;
    }

    startDataCollection() {
        this.updateInterval = setInterval(() => {
            this.collectMetrics();
            this.updateCharts();
        }, 30000); // Update every 30 seconds
        
        // Initial data collection
        this.collectMetrics();
    }

    async collectMetrics() {
        try {
            // Collect hash rate data
            const hashRate = await this.getCurrentHashRate();
            this.metrics.hashRate.push({
                timestamp: Date.now(),
                value: hashRate
            });
            
            // Keep only last 24 hours of data
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            this.metrics.hashRate = this.metrics.hashRate.filter(m => m.timestamp > oneDayAgo);
            
            // Update mining statistics
            this.updateMiningStats();
            
        } catch (error) {
            console.error('Error collecting metrics:', error);
        }
    }

    async getCurrentHashRate() {
        // In a real implementation, this would get actual hash rate from the node
        return Math.random() * 1000000 + 500000;
    }

    updateCharts() {
        // Update hash rate chart
        if (this.charts.hashRate) {
            const labels = this.metrics.hashRate.map(m => 
                new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            );
            const data = this.metrics.hashRate.map(m => m.value);
            
            this.charts.hashRate.data.labels = labels;
            this.charts.hashRate.data.datasets[0].data = data;
            this.charts.hashRate.update('none');
        }
    }

    updateMiningStats() {
        // Update mining statistics display
        const totalMined = this.calculateTotalMined();
        const miningTime = this.calculateMiningTime();
        const avgHashRate = this.calculateAverageHashRate();
        const successRate = this.calculateSuccessRate();
        
        this.updateElement('totalMined', totalMined + ' NASAPEPE');
        this.updateElement('miningTime', miningTime);
        this.updateElement('avgHashRate', this.formatHashRate(avgHashRate));
        this.updateElement('successRate', successRate + '%');
    }

    calculateTotalMined() {
        // Simulate total mined based on blocks found
        const blocksFound = parseInt(document.getElementById('blocksFound')?.textContent || '0');
        return (blocksFound * 500000).toLocaleString();
    }

    calculateMiningTime() {
        // Simulate mining time calculation
        const hours = Math.floor(Math.random() * 24);
        const minutes = Math.floor(Math.random() * 60);
        return `${hours}h ${minutes}m`;
    }

    calculateAverageHashRate() {
        if (this.metrics.hashRate.length === 0) return 0;
        const sum = this.metrics.hashRate.reduce((acc, m) => acc + m.value, 0);
        return sum / this.metrics.hashRate.length;
    }

    calculateSuccessRate() {
        // Simulate success rate calculation
        return (Math.random() * 20 + 80).toFixed(1);
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

    updateTimeRange(range) {
        // Update charts based on selected time range
        const hours = range === '1h' ? 1 : range === '24h' ? 24 : range === '7d' ? 168 : 720;
        this.updateChartsForTimeRange(hours);
    }

    updateChartsForTimeRange(hours) {
        // Update all charts with data for the specified time range
        const labels = this.generateTimeLabels(hours);
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.data.labels) {
                chart.data.labels = labels;
                chart.data.datasets[0].data = this.generateSampleData(hours, 1000, 5000);
                chart.update('none');
            }
        });
    }

    exportAnalyticsData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            miningStats: {
                totalMined: this.calculateTotalMined(),
                miningTime: this.calculateMiningTime(),
                avgHashRate: this.calculateAverageHashRate(),
                successRate: this.calculateSuccessRate()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nasacoin-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Analytics data exported successfully!', 'success');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showToast(message, type = 'info') {
        if (window.nasaCoinDashboard) {
            window.nasaCoinDashboard.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsDashboard;
} else {
    window.AnalyticsDashboard = AnalyticsDashboard;
}