// NASA Coin Dashboard Test Suite
// Comprehensive testing for all enhanced features

class DashboardTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    // Test runner
    async runAllTests() {
        console.log('🧪 NASA Coin Dashboard - Test Suite');
        console.log('=====================================');
        
        // Core functionality tests
        await this.testDOMElements();
        await this.testJavaScriptLoading();
        await this.testCSSLoading();
        await this.testResponsiveDesign();
        
        // Enhanced features tests
        await this.testMiningFeatures();
        await this.testWalletIntegration();
        await this.testPriceTracking();
        await this.testAlertsSystem();
        await this.testChartFunctionality();
        
        // Performance tests
        await this.testPerformance();
        
        // Security tests
        await this.testSecurity();
        
        this.printResults();
    }

    // Test helper methods
    test(name, testFunction) {
        return new Promise(async (resolve) => {
            try {
                const startTime = performance.now();
                await testFunction();
                const endTime = performance.now();
                
                this.passed++;
                this.results.push({
                    name,
                    status: 'PASS',
                    time: `${(endTime - startTime).toFixed(2)}ms`,
                    error: null
                });
                console.log(`✅ ${name}`);
            } catch (error) {
                this.failed++;
                this.results.push({
                    name,
                    status: 'FAIL',
                    time: '0ms',
                    error: error.message
                });
                console.log(`❌ ${name}: ${error.message}`);
            }
            resolve();
        });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // DOM Elements Tests
    async testDOMElements() {
        console.log('\n📋 Testing DOM Elements...');
        
        await this.test('Header elements exist', () => {
            this.assert(document.querySelector('.header'), 'Header not found');
            this.assert(document.querySelector('.logo'), 'Logo not found');
            this.assert(document.querySelector('#connectionStatus'), 'Connection status not found');
        });

        await this.test('Stats grid exists', () => {
            this.assert(document.querySelector('.stats-grid'), 'Stats grid not found');
            this.assert(document.querySelectorAll('.stat-card').length >= 4, 'Not enough stat cards');
        });

        await this.test('Mining section exists', () => {
            this.assert(document.querySelector('.mining-section'), 'Mining section not found');
            this.assert(document.querySelector('#startMining'), 'Start mining button not found');
            this.assert(document.querySelector('#stopMining'), 'Stop mining button not found');
            this.assert(document.querySelector('#threads'), 'Threads input not found');
        });

        await this.test('Enhanced mining elements exist', () => {
            this.assert(document.querySelector('.mining-stats-grid'), 'Mining stats grid not found');
            this.assert(document.querySelector('#miningIntensity'), 'Mining intensity selector not found');
            this.assert(document.querySelector('#autoMining'), 'Auto mining button not found');
            this.assert(document.querySelector('#miningChart'), 'Mining chart canvas not found');
        });

        await this.test('Wallet section exists', () => {
            this.assert(document.querySelector('.wallet-section'), 'Wallet section not found');
            this.assert(document.querySelector('.wallet-grid'), 'Wallet grid not found');
            this.assert(document.querySelectorAll('.wallet-btn').length >= 6, 'Not enough wallet options');
        });

        await this.test('Price section exists', () => {
            this.assert(document.querySelector('.price-section'), 'Price section not found');
            this.assert(document.querySelector('.price-overview'), 'Price overview not found');
            this.assert(document.querySelector('#priceChart'), 'Price chart canvas not found');
        });

        await this.test('Alerts section exists', () => {
            this.assert(document.querySelector('.alerts-section'), 'Alerts section not found');
            this.assert(document.querySelector('#createAlert'), 'Create alert button not found');
            this.assert(document.querySelector('.alert-types'), 'Alert types not found');
        });
    }

    // JavaScript Loading Tests
    async testJavaScriptLoading() {
        console.log('\n📜 Testing JavaScript Loading...');
        
        await this.test('Core classes loaded', () => {
            this.assert(typeof NASACoinDashboard !== 'undefined', 'NASACoinDashboard class not loaded');
            this.assert(typeof WalletIntegration !== 'undefined', 'WalletIntegration class not loaded');
            this.assert(typeof EnhancedFeatures !== 'undefined', 'EnhancedFeatures class not loaded');
        });

        await this.test('External libraries loaded', () => {
            this.assert(typeof Chart !== 'undefined', 'Chart.js not loaded');
            this.assert(typeof QRCode !== 'undefined', 'QRCode library not loaded');
            this.assert(typeof Web3 !== 'undefined', 'Web3 library not loaded');
        });

        await this.test('Dashboard instance created', () => {
            this.assert(window.dashboard instanceof NASACoinDashboard, 'Dashboard instance not created');
        });
    }

    // CSS Loading Tests
    async testCSSLoading() {
        console.log('\n🎨 Testing CSS Loading...');
        
        await this.test('CSS variables defined', () => {
            const styles = getComputedStyle(document.documentElement);
            this.assert(styles.getPropertyValue('--primary-color'), 'Primary color variable not defined');
            this.assert(styles.getPropertyValue('--bg-primary'), 'Background primary variable not defined');
        });

        await this.test('Font loading', () => {
            const body = getComputedStyle(document.body);
            this.assert(body.fontFamily.includes('Inter'), 'Inter font not loaded');
        });

        await this.test('Responsive grid classes', () => {
            this.assert(document.querySelector('.stats-grid'), 'Stats grid class not found');
            this.assert(document.querySelector('.mining-stats-grid'), 'Mining stats grid class not found');
            this.assert(document.querySelector('.wallet-grid'), 'Wallet grid class not found');
        });
    }

    // Responsive Design Tests
    async testResponsiveDesign() {
        console.log('\n📱 Testing Responsive Design...');
        
        await this.test('Mobile viewport meta tag', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            this.assert(viewport, 'Viewport meta tag not found');
            this.assert(viewport.content.includes('width=device-width'), 'Viewport not set for mobile');
        });

        await this.test('CSS media queries', () => {
            // This is a simplified test - in a real scenario you'd test actual responsive behavior
            const stylesheets = Array.from(document.styleSheets);
            let hasMediaQueries = false;
            
            stylesheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || []);
                    hasMediaQueries = rules.some(rule => rule.type === CSSRule.MEDIA_RULE);
                } catch (e) {
                    // Cross-origin stylesheets may not be accessible
                }
            });
            
            this.assert(hasMediaQueries, 'No media queries found in stylesheets');
        });
    }

    // Mining Features Tests
    async testMiningFeatures() {
        console.log('\n⛏️ Testing Mining Features...');
        
        await this.test('Mining controls functional', () => {
            const startBtn = document.querySelector('#startMining');
            const stopBtn = document.querySelector('#stopMining');
            const threadsInput = document.querySelector('#threads');
            
            this.assert(startBtn && !startBtn.disabled, 'Start mining button not functional');
            this.assert(stopBtn, 'Stop mining button not found');
            this.assert(threadsInput && threadsInput.type === 'number', 'Threads input not properly configured');
        });

        await this.test('Enhanced mining controls', () => {
            const intensitySelect = document.querySelector('#miningIntensity');
            const autoBtn = document.querySelector('#autoMining');
            const poolSelect = document.querySelector('#miningPool');
            
            this.assert(intensitySelect, 'Mining intensity selector not found');
            this.assert(autoBtn, 'Auto mining button not found');
            this.assert(poolSelect, 'Pool selector not found');
        });

        await this.test('Mining statistics display', () => {
            const hashRateElement = document.querySelector('#hashRate');
            const blocksFoundElement = document.querySelector('#blocksFound');
            const miningTimeElement = document.querySelector('#miningTime');
            
            this.assert(hashRateElement, 'Hash rate display not found');
            this.assert(blocksFoundElement, 'Blocks found display not found');
            this.assert(miningTimeElement, 'Mining time display not found');
        });
    }

    // Wallet Integration Tests
    async testWalletIntegration() {
        console.log('\n💰 Testing Wallet Integration...');
        
        await this.test('Wallet provider buttons', () => {
            const walletBtns = document.querySelectorAll('.wallet-btn');
            this.assert(walletBtns.length >= 6, 'Not enough wallet provider buttons');
            
            const expectedWallets = ['MetaMask', 'Coinbase', 'WalletConnect', 'Trust Wallet', 'Phantom', 'Ledger'];
            expectedWallets.forEach(wallet => {
                const btn = Array.from(walletBtns).find(b => b.textContent.includes(wallet));
                this.assert(btn, `${wallet} button not found`);
            });
        });

        await this.test('Wallet details section', () => {
            const walletDetails = document.querySelector('#walletDetails');
            const addressInput = document.querySelector('#walletAddress');
            const copyBtn = document.querySelector('#copyAddress');
            const qrBtn = document.querySelector('#qrCode');
            
            this.assert(walletDetails, 'Wallet details section not found');
            this.assert(addressInput, 'Wallet address input not found');
            this.assert(copyBtn, 'Copy address button not found');
            this.assert(qrBtn, 'QR code button not found');
        });

        await this.test('Wallet action buttons', () => {
            const sendBtn = document.querySelector('#sendTokens');
            const receiveBtn = document.querySelector('#receiveTokens');
            const swapBtn = document.querySelector('#swapTokens');
            const stakeBtn = document.querySelector('#stakeTokens');
            
            this.assert(sendBtn, 'Send tokens button not found');
            this.assert(receiveBtn, 'Receive tokens button not found');
            this.assert(swapBtn, 'Swap tokens button not found');
            this.assert(stakeBtn, 'Stake tokens button not found');
        });
    }

    // Price Tracking Tests
    async testPriceTracking() {
        console.log('\n📈 Testing Price Tracking...');
        
        await this.test('Price display elements', () => {
            const priceElement = document.querySelector('#nasapepePrice');
            const changeElement = document.querySelector('#nasapepeChange');
            const marketCapElement = document.querySelector('#marketCap');
            
            this.assert(priceElement, 'Price display not found');
            this.assert(changeElement, 'Price change display not found');
            this.assert(marketCapElement, 'Market cap display not found');
        });

        await this.test('Comparison prices', () => {
            const btcPrice = document.querySelector('#btcPrice');
            const ethPrice = document.querySelector('#ethPrice');
            const dogePrice = document.querySelector('#dogePrice');
            
            this.assert(btcPrice, 'Bitcoin price not found');
            this.assert(ethPrice, 'Ethereum price not found');
            this.assert(dogePrice, 'Dogecoin price not found');
        });

        await this.test('Price chart', () => {
            const priceChart = document.querySelector('#priceChart');
            const chartControls = document.querySelectorAll('.chart-btn[data-timeframe]');
            
            this.assert(priceChart, 'Price chart canvas not found');
            this.assert(chartControls.length >= 5, 'Not enough chart timeframe controls');
        });
    }

    // Alerts System Tests
    async testAlertsSystem() {
        console.log('\n🔔 Testing Alerts System...');
        
        await this.test('Alert type cards', () => {
            const alertTypes = document.querySelectorAll('.alert-type-card');
            this.assert(alertTypes.length >= 4, 'Not enough alert type cards');
        });

        await this.test('Create alert functionality', () => {
            const createBtn = document.querySelector('#createAlert');
            const alertsList = document.querySelector('#alertsList');
            const notificationsList = document.querySelector('#notificationsList');
            
            this.assert(createBtn, 'Create alert button not found');
            this.assert(alertsList, 'Alerts list not found');
            this.assert(notificationsList, 'Notifications list not found');
        });

        await this.test('Alert count displays', () => {
            const priceCount = document.querySelector('#priceAlertsCount');
            const miningCount = document.querySelector('#miningAlertsCount');
            const walletCount = document.querySelector('#walletAlertsCount');
            const networkCount = document.querySelector('#networkAlertsCount');
            
            this.assert(priceCount, 'Price alerts count not found');
            this.assert(miningCount, 'Mining alerts count not found');
            this.assert(walletCount, 'Wallet alerts count not found');
            this.assert(networkCount, 'Network alerts count not found');
        });
    }

    // Chart Functionality Tests
    async testChartFunctionality() {
        console.log('\n📊 Testing Chart Functionality...');
        
        await this.test('Chart.js library', () => {
            this.assert(typeof Chart !== 'undefined', 'Chart.js not loaded');
            this.assert(Chart.version, 'Chart.js version not available');
        });

        await this.test('Chart canvases', () => {
            const miningChart = document.querySelector('#miningChart');
            const priceChart = document.querySelector('#priceChart');
            
            this.assert(miningChart && miningChart.tagName === 'CANVAS', 'Mining chart canvas not found');
            this.assert(priceChart && priceChart.tagName === 'CANVAS', 'Price chart canvas not found');
        });

        await this.test('Chart controls', () => {
            const miningControls = document.querySelectorAll('.chart-btn[data-period]');
            const priceControls = document.querySelectorAll('.chart-btn[data-timeframe]');
            
            this.assert(miningControls.length >= 4, 'Not enough mining chart controls');
            this.assert(priceControls.length >= 5, 'Not enough price chart controls');
        });
    }

    // Performance Tests
    async testPerformance() {
        console.log('\n⚡ Testing Performance...');
        
        await this.test('Page load time', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.assert(loadTime < 5000, `Page load time too slow: ${loadTime}ms`);
        });

        await this.test('DOM elements count', () => {
            const elementCount = document.querySelectorAll('*').length;
            this.assert(elementCount < 1000, `Too many DOM elements: ${elementCount}`);
        });

        await this.test('CSS file size', () => {
            // This is a simplified test - in practice you'd check actual file sizes
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            this.assert(stylesheets.length <= 5, 'Too many CSS files');
        });

        await this.test('JavaScript file count', () => {
            const scripts = document.querySelectorAll('script[src]');
            this.assert(scripts.length <= 10, 'Too many JavaScript files');
        });
    }

    // Security Tests
    async testSecurity() {
        console.log('\n🔒 Testing Security...');
        
        await this.test('No inline scripts', () => {
            const inlineScripts = document.querySelectorAll('script:not([src])');
            // Allow for small configuration scripts
            this.assert(inlineScripts.length <= 2, 'Too many inline scripts detected');
        });

        await this.test('HTTPS resources', () => {
            const externalLinks = document.querySelectorAll('link[href^="http"], script[src^="http"]');
            let hasInsecureResources = false;
            
            externalLinks.forEach(link => {
                const url = link.href || link.src;
                if (url.startsWith('http://') && !url.includes('localhost')) {
                    hasInsecureResources = true;
                }
            });
            
            this.assert(!hasInsecureResources, 'Insecure HTTP resources detected');
        });

        await this.test('Input validation elements', () => {
            const numberInputs = document.querySelectorAll('input[type="number"]');
            numberInputs.forEach(input => {
                this.assert(input.hasAttribute('min') || input.hasAttribute('max'), 
                    'Number input without validation attributes');
            });
        });
    }

    // Print test results
    printResults() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`   • ${result.name}: ${result.error}`);
            });
        }
        
        console.log('\n🎯 Performance Metrics:');
        const totalTime = this.results.reduce((sum, r) => sum + parseFloat(r.time), 0);
        console.log(`   • Total test time: ${totalTime.toFixed(2)}ms`);
        console.log(`   • Average test time: ${(totalTime / this.results.length).toFixed(2)}ms`);
        
        // Overall assessment
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! Dashboard is ready for deployment.');
        } else if (this.failed <= 2) {
            console.log('\n⚠️ Minor issues detected. Review failed tests before deployment.');
        } else {
            console.log('\n🚨 Major issues detected. Fix failed tests before deployment.');
        }
    }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all scripts to load
    setTimeout(() => {
        const tester = new DashboardTester();
        tester.runAllTests();
    }, 2000);
});

// Export for manual testing
window.DashboardTester = DashboardTester;

