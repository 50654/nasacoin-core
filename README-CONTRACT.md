# 🚀 NASA Coin ERC-20 Token Contract

NASA Coin (NASAPEPE) is an ERC-20 token with a 5,000,000 max supply, burnable and pausable controls, simplified PoW-style mining rewards, and on-chain staking with a default 10% APY (configurable by the owner), plus protections via Ownable and ReentrancyGuard.

## 🌟 Features

### Core Token Features
- **ERC-20 Compliant**: Standard token functionality
- **Limited Supply**: Maximum 5,000,000 NASAPEPE tokens
- **High Block Rewards**: 500,000 NASAPEPE per successful mine
- **Burnable**: Tokens can be burned to reduce supply
- **Pausable**: Emergency pause functionality
- **Ownable**: Administrative controls

### Mining System
- **Proof-of-Work Simulation**: Hash-based mining mechanism
- **Adjustable Difficulty**: Automatic difficulty adjustment
- **Mining Cooldown**: Prevents spam mining attempts
- **Block Rewards**: Substantial rewards for successful miners

### Staking System
- **Token Staking**: Stake tokens to earn rewards
- **Flexible APY**: Configurable annual percentage yield
- **Compound Rewards**: Automatic reward compounding
- **Instant Unstaking**: No lock-up periods

### Security Features
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Owner-only administrative functions
- **Emergency Functions**: Pause and emergency withdrawal
- **Comprehensive Testing**: Full test suite included

## 📋 Contract Specifications

| Parameter | Value |
|-----------|-------|
| **Name** | NASA Coin |
| **Symbol** | NASAPEPE |
| **Decimals** | 18 |
| **Initial Supply** | 1,000,000 NASAPEPE |
| **Max Supply** | 5,000,000 NASAPEPE |
| **Block Reward** | 500,000 NASAPEPE |
| **Default Staking APY** | 10% |
| **Mining Cooldown** | 10 minutes |

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js and npm
node --version  # v16+ required
npm --version

# Install dependencies
npm install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
- `PRIVATE_KEY`: Your deployment wallet private key
- `ETHEREUM_RPC_URL`: Ethereum mainnet RPC endpoint
- `SEPOLIA_RPC_URL`: Sepolia testnet RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification

### Compilation

```bash
# Compile contracts
npm run compile

# Check contract size
npm run size
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run gas usage report
REPORT_GAS=true npm test
```

### Deployment

#### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

#### Testnet Deployment
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Polygon Mumbai
npm run deploy:mumbai

# Deploy to BSC testnet
npm run deploy:bsc-testnet
```

#### Mainnet Deployment
```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet

# Deploy to Polygon mainnet
npm run deploy:polygon

# Deploy to BSC mainnet
npm run deploy:bsc
```

### Contract Verification

```bash
# Verify on Sepolia
npm run verify:sepolia <CONTRACT_ADDRESS>

# Verify on Polygon
npm run verify:polygon <CONTRACT_ADDRESS>

# Verify on BSC
npm run verify:bsc <CONTRACT_ADDRESS>
```

## 🔧 Contract Interaction

### Using Scripts

```bash
# Interact with deployed contract
npx hardhat run scripts/interact.js --network sepolia

# Verify contract
npx hardhat run scripts/verify.js --network sepolia
```

### Using Hardhat Console

```bash
# Start console
npx hardhat console --network sepolia

# Get contract instance
const NASACoin = await ethers.getContractFactory("NASACoin");
const nasaCoin = NASACoin.attach("CONTRACT_ADDRESS");

# Check balance
const balance = await nasaCoin.balanceOf("ADDRESS");
console.log(ethers.utils.formatEther(balance));

# Mine tokens
await nasaCoin.mine(12345);

# Stake tokens
await nasaCoin.stake(ethers.utils.parseEther("100"));
```

## 📊 Contract Functions

### Public Functions

#### Token Operations
```solidity
// Standard ERC-20 functions
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)

// Burn tokens
function burn(uint256 amount) external
function burnFrom(address account, uint256 amount) external
```

#### Mining Functions
```solidity
// Mine new tokens
function mine(uint256 nonce) external

// Get mining information
function getMiningInfo(address account) external view returns (
    uint256 lastMining,
    uint256 nextMiningTime,
    uint256 currentDifficulty,
    bool canMine
)
```

#### Staking Functions
```solidity
// Stake tokens
function stake(uint256 amount) external

// Unstake tokens
function unstake(uint256 amount) external

// Claim staking rewards
function claimRewards() external

// Get staking information
function getStakingInfo(address account) external view returns (
    uint256 stakedAmount,
    uint256 stakingTime,
    uint256 pendingRewards,
    uint256 totalRewards
)
```

### Owner Functions

```solidity
// Administrative controls
function setMiningCooldown(uint256 _cooldown) external onlyOwner
function setStakingAPY(uint256 _apy) external onlyOwner
function pause() external onlyOwner
function unpause() external onlyOwner
function emergencyWithdraw(address token, uint256 amount) external onlyOwner
```

## 🔒 Security Considerations

### Implemented Protections
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency stop mechanism
- **Access Control**: Owner-only sensitive functions
- **Input Validation**: Comprehensive parameter checking
- **Overflow Protection**: SafeMath equivalent (Solidity 0.8+)

### Best Practices
- Always test on testnet first
- Verify contracts on block explorers
- Use multi-signature wallets for ownership
- Monitor contract activity regularly
- Keep private keys secure

## 📈 Tokenomics

### Supply Distribution
- **Initial Supply**: 1,000,000 NASAPEPE (20%)
- **Mining Rewards**: 4,000,000 NASAPEPE (80%)
- **Maximum Supply**: 5,000,000 NASAPEPE (hard cap)

### Mining Economics
- **Block Reward**: 500,000 NASAPEPE per successful mine
- **Total Blocks**: ~8 blocks to reach max supply
- **Difficulty Adjustment**: Every 100 blocks
- **Cooldown Period**: 10 minutes between attempts

### Staking Rewards
- **Default APY**: 10% annual percentage yield
- **Reward Source**: New token minting (within max supply)
- **Compounding**: Automatic reward compounding
- **Flexibility**: No lock-up periods

## 🌐 Network Deployment Addresses

### Testnets
- **Sepolia**: `TBD` (Deploy first)
- **Mumbai**: `TBD` (Deploy first)
- **BSC Testnet**: `TBD` (Deploy first)

### Mainnets
- **Ethereum**: `TBD` (Deploy when ready)
- **Polygon**: `TBD` (Deploy when ready)
- **BSC**: `TBD` (Deploy when ready)

## 🛠️ Development

### Project Structure
```
contracts/
├── NASACoin.sol          # Main token contract
scripts/
├── deploy.js             # Deployment script
├── verify.js             # Verification script
├── interact.js           # Interaction examples
test/
├── NASACoin.test.js      # Comprehensive tests
deployments/
├── sepolia-11155111.json # Deployment info
├── NASACoin-ABI.json     # Contract ABI
```

### Adding New Features

1. **Modify Contract**: Update `contracts/NASACoin.sol`
2. **Add Tests**: Update `test/NASACoin.test.js`
3. **Test Locally**: `npm test`
4. **Deploy to Testnet**: `npm run deploy:sepolia`
5. **Verify Contract**: `npm run verify:sepolia`

### Gas Optimization Tips

- Use `uint256` instead of smaller integers
- Pack struct variables efficiently
- Minimize storage operations
- Use events for data that doesn't need on-chain storage
- Consider using libraries for complex calculations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This smart contract is experimental and for educational purposes. Conduct thorough testing and auditing before mainnet deployment. The developers are not responsible for any losses incurred.

## 🚀 To the Moon and Beyond! 🌙

NASA Coin represents the future of space-themed cryptocurrency with innovative tokenomics and community-driven features.

---

**Happy Mining! 🛸**