// NASA Coin Staking & Pool Mining Module

// Import UI helpers if available
if (typeof require !== 'undefined') {
    try {
        const { showToast, updateElement, setupModalEventListeners, setModalWalletAddress } = require('./utils/ui-helpers');
        var uiShowToast = showToast;
        var uiUpdateElement = updateElement;
        var uiSetupModalEventListeners = setupModalEventListeners;
        var uiSetModalWalletAddress = setModalWalletAddress;
    } catch (e) {
        // Will use window.UIHelpers in browser
    }
}

class StakingPool {
    constructor() {
        this.pools = [];
        this.userStakes = [];
        this.poolStats = {
            totalStaked: 0,
            totalRewards: 0,
            activePools: 0,
            averageAPY: 0
        };
        this.stakingContract = null;
        this.web3 = null;
        
        this.init();
    }

    async init() {
        this.setupStakingInterface();
        this.setupEventListeners();
        await this.loadPoolData();
        this.startPoolUpdates();
    }

    setupStakingInterface() {
        const stakingSection = document.createElement('section');
        stakingSection.className = 'staking-section';
        stakingSection.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-gem"></i> Staking & Pool Mining</h2>
                <div class="staking-controls">
                    <button id="createPool" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Pool
                    </button>
                    <button id="joinPool" class="btn btn-secondary">
                        <i class="fas fa-users"></i> Join Pool
                    </button>
                </div>
            </div>
            
            <div class="staking-content">
                <!-- Pool Statistics -->
                <div class="pool-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Staked</h3>
                            <div class="stat-value" id="totalStaked">0 NASAPEPE</div>
                            <div class="stat-label">Across All Pools</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Average APY</h3>
                            <div class="stat-value" id="averageAPY">0%</div>
                            <div class="stat-label">Annual Percentage Yield</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Active Pools</h3>
                            <div class="stat-value" id="activePools">0</div>
                            <div class="stat-label">Currently Mining</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Rewards</h3>
                            <div class="stat-value" id="totalRewards">0 NASAPEPE</div>
                            <div class="stat-label">Distributed</div>
                        </div>
                    </div>
                </div>

                <!-- Pool List -->
                <div class="pools-section">
                    <h3><i class="fas fa-list"></i> Available Pools</h3>
                    <div class="pools-grid" id="poolsGrid">
                        <!-- Pools will be populated here -->
                    </div>
                </div>

                <!-- User Stakes -->
                <div class="user-stakes">
                    <h3><i class="fas fa-wallet"></i> My Stakes</h3>
                    <div class="stakes-list" id="stakesList">
                        <!-- User stakes will be populated here -->
                    </div>
                </div>

                <!-- Staking Calculator -->
                <div class="staking-calculator">
                    <h3><i class="fas fa-calculator"></i> Staking Calculator</h3>
                    <div class="calculator-content">
                        <div class="calculator-inputs">
                            <div class="form-group">
                                <label>Amount to Stake (NASAPEPE):</label>
                                <input type="number" id="stakeAmount" placeholder="1000" step="1">
                            </div>
                            <div class="form-group">
                                <label>Pool APY (%):</label>
                                <input type="number" id="poolAPY" placeholder="12.5" step="0.1">
                            </div>
                            <div class="form-group">
                                <label>Staking Period (days):</label>
                                <input type="number" id="stakingPeriod" placeholder="30" step="1">
                            </div>
                        </div>
                        <div class="calculator-results">
                            <div class="result-item">
                                <span class="result-label">Daily Rewards:</span>
                                <span class="result-value" id="dailyRewards">0 NASAPEPE</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Total Rewards:</span>
                                <span class="result-value" id="totalRewardsCalc">0 NASAPEPE</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Final Amount:</span>
                                <span class="result-value" id="finalAmount">0 NASAPEPE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after analytics section
        const analyticsSection = document.querySelector('.analytics-section');
        if (analyticsSection) {
            analyticsSection.parentNode.insertBefore(stakingSection, analyticsSection.nextSibling);
        } else {
            // Insert before blockchain section if analytics section doesn't exist
            const blockchainSection = document.querySelector('.blockchain-section');
            blockchainSection.parentNode.insertBefore(stakingSection, blockchainSection);
        }
    }

    setupEventListeners() {
        // Pool creation
        document.getElementById('createPool')?.addEventListener('click', () => {
            this.showCreatePoolModal();
        });
        
        // Join pool
        document.getElementById('joinPool')?.addEventListener('click', () => {
            this.showJoinPoolModal();
        });
        
        // Calculator inputs
        document.getElementById('stakeAmount')?.addEventListener('input', () => {
            this.calculateStakingRewards();
        });
        
        document.getElementById('poolAPY')?.addEventListener('input', () => {
            this.calculateStakingRewards();
        });
        
        document.getElementById('stakingPeriod')?.addEventListener('input', () => {
            this.calculateStakingRewards();
        });
    }

    async loadPoolData() {
        // Simulate loading pool data
        this.pools = [
            {
                id: 1,
                name: 'Moon Mission Pool',
                apy: 15.5,
                totalStaked: 2500000,
                participants: 45,
                minStake: 1000,
                maxStake: 100000,
                lockPeriod: 30,
                status: 'active',
                description: 'High-performance pool for serious stakers'
            },
            {
                id: 2,
                name: 'Rocket Boost Pool',
                apy: 12.8,
                totalStaked: 1800000,
                participants: 32,
                minStake: 500,
                maxStake: 50000,
                lockPeriod: 14,
                status: 'active',
                description: 'Balanced pool with moderate lock period'
            },
            {
                id: 3,
                name: 'Space Explorer Pool',
                apy: 18.2,
                totalStaked: 3200000,
                participants: 67,
                minStake: 2000,
                maxStake: 200000,
                lockPeriod: 60,
                status: 'active',
                description: 'Premium pool with highest rewards'
            },
            {
                id: 4,
                name: 'Starter Pool',
                apy: 8.5,
                totalStaked: 800000,
                participants: 28,
                minStake: 100,
                maxStake: 10000,
                lockPeriod: 7,
                status: 'active',
                description: 'Perfect for beginners'
            }
        ];
        
        this.updatePoolStats();
        this.renderPools();
        this.renderUserStakes();
    }

    updatePoolStats() {
        this.poolStats.totalStaked = this.pools.reduce((sum, pool) => sum + pool.totalStaked, 0);
        this.poolStats.activePools = this.pools.filter(pool => pool.status === 'active').length;
        this.poolStats.averageAPY = this.pools.reduce((sum, pool) => sum + pool.apy, 0) / this.pools.length;
        this.poolStats.totalRewards = this.poolStats.totalStaked * 0.1; // Simulate 10% of staked amount as rewards
        
        this.updateElement('totalStaked', this.poolStats.totalStaked.toLocaleString());
        this.updateElement('averageAPY', this.poolStats.averageAPY.toFixed(2) + '%');
        this.updateElement('activePools', this.poolStats.activePools);
        this.updateElement('totalRewards', this.poolStats.totalRewards.toLocaleString());
    }

    renderPools() {
        const poolsGrid = document.getElementById('poolsGrid');
        if (!poolsGrid) return;
        
        poolsGrid.innerHTML = this.pools.map(pool => `
            <div class="pool-card" data-pool-id="${pool.id}">
                <div class="pool-header">
                    <h4>${pool.name}</h4>
                    <span class="pool-status ${pool.status}">${pool.status}</span>
                </div>
                <div class="pool-content">
                    <div class="pool-stats">
                        <div class="pool-stat">
                            <span class="label">APY:</span>
                            <span class="value apy">${pool.apy}%</span>
                        </div>
                        <div class="pool-stat">
                            <span class="label">Total Staked:</span>
                            <span class="value">${pool.totalStaked.toLocaleString()} NASAPEPE</span>
                        </div>
                        <div class="pool-stat">
                            <span class="label">Participants:</span>
                            <span class="value">${pool.participants}</span>
                        </div>
                        <div class="pool-stat">
                            <span class="label">Lock Period:</span>
                            <span class="value">${pool.lockPeriod} days</span>
                        </div>
                    </div>
                    <div class="pool-description">
                        <p>${pool.description}</p>
                    </div>
                    <div class="pool-actions">
                        <button class="btn btn-primary btn-small stake-btn" data-pool-id="${pool.id}">
                            <i class="fas fa-gem"></i> Stake
                        </button>
                        <button class="btn btn-outline btn-small info-btn" data-pool-id="${pool.id}">
                            <i class="fas fa-info-circle"></i> Info
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to pool cards
        poolsGrid.querySelectorAll('.stake-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poolId = parseInt(e.target.dataset.poolId);
                this.showStakeModal(poolId);
            });
        });
        
        poolsGrid.querySelectorAll('.info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poolId = parseInt(e.target.dataset.poolId);
                this.showPoolInfo(poolId);
            });
        });
    }

    renderUserStakes() {
        const stakesList = document.getElementById('stakesList');
        if (!stakesList) return;
        
        if (this.userStakes.length === 0) {
            stakesList.innerHTML = `
                <div class="no-stakes">
                    <i class="fas fa-gem"></i>
                    <p>No active stakes. Join a pool to start earning rewards!</p>
                </div>
            `;
            return;
        }
        
        stakesList.innerHTML = this.userStakes.map(stake => `
            <div class="stake-item">
                <div class="stake-info">
                    <h4>${stake.poolName}</h4>
                    <div class="stake-details">
                        <span class="stake-amount">${stake.amount.toLocaleString()} NASAPEPE</span>
                        <span class="stake-apy">${stake.apy}% APY</span>
                    </div>
                </div>
                <div class="stake-stats">
                    <div class="stake-stat">
                        <span class="label">Rewards Earned:</span>
                        <span class="value">${stake.rewardsEarned.toFixed(2)} NASAPEPE</span>
                    </div>
                    <div class="stake-stat">
                        <span class="label">Days Remaining:</span>
                        <span class="value">${stake.daysRemaining}</span>
                    </div>
                </div>
                <div class="stake-actions">
                    <button class="btn btn-outline btn-small" onclick="stakingPool.claimRewards(${stake.id})">
                        <i class="fas fa-hand-holding-usd"></i> Claim
                    </button>
                    <button class="btn btn-danger btn-small" onclick="stakingPool.unstake(${stake.id})">
                        <i class="fas fa-times"></i> Unstake
                    </button>
                </div>
            </div>
        `).join('');
    }

    showCreatePoolModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Create New Pool</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Pool Name:</label>
                        <input type="text" id="poolName" placeholder="Enter pool name">
                    </div>
                    <div class="form-group">
                        <label>APY (%):</label>
                        <input type="number" id="poolAPY" placeholder="12.5" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Minimum Stake (NASAPEPE):</label>
                        <input type="number" id="minStake" placeholder="1000" step="1">
                    </div>
                    <div class="form-group">
                        <label>Maximum Stake (NASAPEPE):</label>
                        <input type="number" id="maxStake" placeholder="100000" step="1">
                    </div>
                    <div class="form-group">
                        <label>Lock Period (days):</label>
                        <input type="number" id="lockPeriod" placeholder="30" step="1">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="poolDescription" placeholder="Describe your pool..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="createPoolBtn" class="btn btn-primary">Create Pool</button>
                    <button id="cancelCreatePool" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancelCreatePool').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#createPoolBtn').addEventListener('click', () => {
            this.createPool();
            modal.remove();
        });
    }

    showJoinPoolModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Join Pool</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Select Pool:</label>
                        <select id="selectedPool">
                            ${this.pools.map(pool => `
                                <option value="${pool.id}">${pool.name} (${pool.apy}% APY)</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Stake Amount (NASAPEPE):</label>
                        <input type="number" id="stakeAmount" placeholder="1000" step="1">
                    </div>
                    <div class="form-group">
                        <label>Wallet Address:</label>
                        <input type="text" id="walletAddress" placeholder="Enter wallet address" readonly>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="joinPoolBtn" class="btn btn-primary">Join Pool</button>
                    <button id="cancelJoinPool" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set wallet address if available using helper
        if (typeof uiSetModalWalletAddress === 'function') {
            uiSetModalWalletAddress('walletAddress');
        } else if (window.UIHelpers) {
            window.UIHelpers.setModalWalletAddress('walletAddress');
        } else {
            const walletAddress = document.getElementById('walletAddress');
            if (window.nasaCoinDashboard && window.nasaCoinDashboard.currentAddress) {
                walletAddress.value = window.nasaCoinDashboard.currentAddress;
            }
        }
        
        // Setup event listeners using helper
        if (typeof uiSetupModalEventListeners === 'function') {
            uiSetupModalEventListeners(modal, '.modal-close', '#cancelJoinPool');
        } else if (window.UIHelpers) {
            window.UIHelpers.setupModalEventListeners(modal, '.modal-close', '#cancelJoinPool');
        } else {
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
            });
            modal.querySelector('#cancelJoinPool').addEventListener('click', () => {
                modal.remove();
            });
        }
        
        modal.querySelector('#joinPoolBtn').addEventListener('click', () => {
            this.joinPool();
            modal.remove();
        });
    }

    showStakeModal(poolId) {
        const pool = this.pools.find(p => p.id === poolId);
        if (!pool) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Stake in ${pool.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pool-info">
                        <div class="info-item">
                            <span class="label">APY:</span>
                            <span class="value">${pool.apy}%</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Lock Period:</span>
                            <span class="value">${pool.lockPeriod} days</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Min/Max Stake:</span>
                            <span class="value">${pool.minStake.toLocaleString()} - ${pool.maxStake.toLocaleString()} NASAPEPE</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Stake Amount (NASAPEPE):</label>
                        <input type="number" id="stakeAmount" placeholder="${pool.minStake}" min="${pool.minStake}" max="${pool.maxStake}" step="1">
                    </div>
                    <div class="form-group">
                        <label>Wallet Address:</label>
                        <input type="text" id="walletAddress" placeholder="Enter wallet address" readonly>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="confirmStake" class="btn btn-primary">Confirm Stake</button>
                    <button id="cancelStake" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set wallet address if available using helper
        if (typeof uiSetModalWalletAddress === 'function') {
            uiSetModalWalletAddress('walletAddress');
        } else if (window.UIHelpers) {
            window.UIHelpers.setModalWalletAddress('walletAddress');
        } else {
            const walletAddress = document.getElementById('walletAddress');
            if (window.nasaCoinDashboard && window.nasaCoinDashboard.currentAddress) {
                walletAddress.value = window.nasaCoinDashboard.currentAddress;
            }
        }
        
        // Setup event listeners using helper
        if (typeof uiSetupModalEventListeners === 'function') {
            uiSetupModalEventListeners(modal, '.modal-close', '#cancelStake');
        } else if (window.UIHelpers) {
            window.UIHelpers.setupModalEventListeners(modal, '.modal-close', '#cancelStake');
        } else {
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
            });
            modal.querySelector('#cancelStake').addEventListener('click', () => {
                modal.remove();
            });
        }
        
        modal.querySelector('#confirmStake').addEventListener('click', () => {
            this.stakeInPool(poolId);
            modal.remove();
        });
    }

    createPool() {
        const poolName = document.getElementById('poolName').value;
        const apy = parseFloat(document.getElementById('poolAPY').value);
        const minStake = parseInt(document.getElementById('minStake').value);
        const maxStake = parseInt(document.getElementById('maxStake').value);
        const lockPeriod = parseInt(document.getElementById('lockPeriod').value);
        const description = document.getElementById('poolDescription').value;
        
        if (!poolName || !apy || !minStake || !maxStake || !lockPeriod) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const newPool = {
            id: this.pools.length + 1,
            name: poolName,
            apy: apy,
            totalStaked: 0,
            participants: 0,
            minStake: minStake,
            maxStake: maxStake,
            lockPeriod: lockPeriod,
            status: 'active',
            description: description
        };
        
        this.pools.push(newPool);
        this.updatePoolStats();
        this.renderPools();
        
        this.showToast('Pool created successfully!', 'success');
    }

    joinPool() {
        const poolId = parseInt(document.getElementById('selectedPool').value);
        const stakeAmount = parseInt(document.getElementById('stakeAmount').value);
        const walletAddress = document.getElementById('walletAddress').value;
        
        if (!poolId || !stakeAmount || !walletAddress) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const pool = this.pools.find(p => p.id === poolId);
        if (!pool) {
            this.showToast('Pool not found', 'error');
            return;
        }
        
        if (stakeAmount < pool.minStake || stakeAmount > pool.maxStake) {
            this.showToast(`Stake amount must be between ${pool.minStake} and ${pool.maxStake} NASAPEPE`, 'error');
            return;
        }
        
        // Add to user stakes
        const newStake = {
            id: this.userStakes.length + 1,
            poolId: poolId,
            poolName: pool.name,
            amount: stakeAmount,
            apy: pool.apy,
            rewardsEarned: 0,
            daysRemaining: pool.lockPeriod,
            startDate: new Date(),
            walletAddress: walletAddress
        };
        
        this.userStakes.push(newStake);
        
        // Update pool stats
        pool.totalStaked += stakeAmount;
        pool.participants += 1;
        
        this.updatePoolStats();
        this.renderPools();
        this.renderUserStakes();
        
        this.showToast(`Successfully staked ${stakeAmount.toLocaleString()} NASAPEPE in ${pool.name}!`, 'success');
    }

    stakeInPool(poolId) {
        const stakeAmount = parseInt(document.getElementById('stakeAmount').value);
        const walletAddress = document.getElementById('walletAddress').value;
        
        if (!stakeAmount || !walletAddress) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        this.joinPool(); // Reuse join pool logic
    }

    calculateStakingRewards() {
        const amount = parseFloat(document.getElementById('stakeAmount')?.value || 0);
        const apy = parseFloat(document.getElementById('poolAPY')?.value || 0);
        const period = parseInt(document.getElementById('stakingPeriod')?.value || 0);
        
        if (amount && apy && period) {
            const dailyRate = apy / 365 / 100;
            const dailyRewards = amount * dailyRate;
            const totalRewards = dailyRewards * period;
            const finalAmount = amount + totalRewards;
            
            this.updateElement('dailyRewards', dailyRewards.toFixed(2) + ' NASAPEPE');
            this.updateElement('totalRewardsCalc', totalRewards.toFixed(2) + ' NASAPEPE');
            this.updateElement('finalAmount', finalAmount.toFixed(2) + ' NASAPEPE');
        }
    }

    claimRewards(stakeId) {
        const stake = this.userStakes.find(s => s.id === stakeId);
        if (!stake) return;
        
        // Simulate claiming rewards
        const rewards = stake.rewardsEarned;
        stake.rewardsEarned = 0;
        
        this.renderUserStakes();
        this.showToast(`Claimed ${rewards.toFixed(2)} NASAPEPE rewards!`, 'success');
    }

    unstake(stakeId) {
        const stake = this.userStakes.find(s => s.id === stakeId);
        if (!stake) return;
        
        if (stake.daysRemaining > 0) {
            this.showToast('Cannot unstake before lock period ends', 'warning');
            return;
        }
        
        // Remove stake
        this.userStakes = this.userStakes.filter(s => s.id !== stakeId);
        
        // Update pool stats
        const pool = this.pools.find(p => p.id === stake.poolId);
        if (pool) {
            pool.totalStaked -= stake.amount;
            pool.participants -= 1;
        }
        
        this.updatePoolStats();
        this.renderPools();
        this.renderUserStakes();
        
        this.showToast(`Unstaked ${stake.amount.toLocaleString()} NASAPEPE from ${stake.poolName}`, 'success');
    }

    showPoolInfo(poolId) {
        const pool = this.pools.find(p => p.id === poolId);
        if (!pool) return;
        
        const info = `
Pool: ${pool.name}
APY: ${pool.apy}%
Total Staked: ${pool.totalStaked.toLocaleString()} NASAPEPE
Participants: ${pool.participants}
Lock Period: ${pool.lockPeriod} days
Min/Max Stake: ${pool.minStake.toLocaleString()} - ${pool.maxStake.toLocaleString()} NASAPEPE
Description: ${pool.description}
        `;
        
        alert(info);
    }

    startPoolUpdates() {
        setInterval(() => {
            this.updateStakeRewards();
        }, 60000); // Update every minute
    }

    updateStakeRewards() {
        this.userStakes.forEach(stake => {
            if (stake.daysRemaining > 0) {
                const dailyRate = stake.apy / 365 / 100;
                const dailyRewards = stake.amount * dailyRate;
                stake.rewardsEarned += dailyRewards;
                stake.daysRemaining -= 1 / (24 * 60); // Decrease by 1 minute worth of days
            }
        });
        
        this.renderUserStakes();
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
    module.exports = StakingPool;
} else {
    window.StakingPool = StakingPool;
}