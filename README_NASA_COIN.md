# 🚀 NASA Coin Core

**NASA Coin ($NASAPEPE)** is a custom Bitcoin fork with limited supply, meme-fueled branding, and ultra-high block rewards. Designed for fun, experimentation, and mining with pool support.

---

## 🌌 Coin Specifications

| Parameter        | Value              |
|------------------|--------------------|
| Name             | NASA Coin          |
| Ticker           | NASAPEPE           |
| Algorithm        | SHA256 (Proof of Work) |
| Block Reward     | 500,000 NASAPEPE   |
| Max Supply       | 5,000,000 NASAPEPE |
| Mining Mode      | Pool-ready         |
| Forked From      | Bitcoin Core v25.1 |
| Network Port     | 8334               |
| RPC Port         | 18334              |
| Message Start    | "NASA" (0x4e415341) |

---

## ⚙️ Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/nasacoin-core.git
cd nasacoin-core

# Run automated deployment
./deploy_nasacoin.sh all
```

### Option 2: Manual Build

```bash
# Install dependencies
sudo apt update
sudo apt install -y build-essential libtool autotools-dev automake pkg-config \
    libssl-dev libevent-dev bsdmainutils libboost-all-dev libdb-dev libdb++-dev

# Build NASA Coin
cd bitcoin-core
./autogen.sh
./configure --disable-wallet --disable-gui
make -j$(nproc)
sudo make install
```

### Option 3: Docker Deployment

```bash
# Build and run with Docker
docker build -t nasacoin:latest .
docker-compose up -d
```

---

## 🔧 Configuration

### Main Configuration File

The main configuration file is located at `~/.nasacoin/nasacoin.conf`:

```ini
# Network settings
networkid=nasacoin
port=8334
rpcport=18334

# RPC settings
rpcuser=nasauser
rpcpassword=supersecurepassword
rpcallowip=127.0.0.1
rpcbind=0.0.0.0:18334

# Node settings
listen=1
server=1
daemon=1
txindex=1
gen=0

# Mining settings (set to 1 to enable mining)
# gen=1
# genproclimit=1
```

---

## 🚀 Usage

### Starting the Node

```bash
# Start as daemon
nasacoind -daemon

# Start with custom config
nasacoind -daemon -conf=/path/to/nasacoin.conf

# Start with systemd service
sudo systemctl start nasacoind
```

### Using the CLI

```bash
# Get blockchain info
nasacoin-cli getblockchaininfo

# Get network info
nasacoin-cli getnetworkinfo

# Get mining info
nasacoin-cli getmininginfo

# Get balance (if wallet enabled)
nasacoin-cli getbalance
```

### Mining

```bash
# Enable mining in config
echo "gen=1" >> ~/.nasacoin/nasacoin.conf
echo "genproclimit=1" >> ~/.nasacoin/nasacoin.conf

# Restart daemon
nasacoind -daemon

# Check mining status
nasacoin-cli getmininginfo
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start NASA Coin node
docker-compose up -d

# View logs
docker-compose logs -f nasacoin-node

# Stop services
docker-compose down
```

### Using Docker directly

```bash
# Build image
docker build -t nasacoin:latest .

# Run container
docker run -d \
  --name nasacoin-node \
  -p 8334:8334 \
  -p 18334:18334 \
  -v nasacoin-data:/home/nasacoin/.nasacoin \
  nasacoin:latest
```

---

## 🔍 Monitoring

### Service Status

```bash
# Check service status
sudo systemctl status nasacoind

# View logs
sudo journalctl -u nasacoind -f

# Check if node is running
nasacoin-cli getblockchaininfo
```

### Health Checks

```bash
# Basic health check
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"1.0","id":"1","method":"getblockchaininfo","params":[]}' \
  http://localhost:18334
```

---

## 🛠️ Development

### Building from Source

```bash
# Clone Bitcoin Core
git clone https://github.com/bitcoin/bitcoin.git bitcoin-core
cd bitcoin-core

# Checkout specific version
git checkout v25.1

# Create NASA Coin branch
git checkout -b nasacoin-v1.0

# Apply NASA Coin modifications
# (See modification details in the source code)

# Build
./autogen.sh
./configure --disable-wallet --disable-gui
make -j$(nproc)
```

### Key Modifications Made

1. **Block Reward**: Changed from 50 BTC to 500,000 NASAPEPE
2. **Max Supply**: Changed from 21M to 5M NASAPEPE
3. **Network ID**: Changed to "nasacoin"
4. **Ports**: P2P port 8334, RPC port 18334
5. **Message Start**: Changed to "NASA" (0x4e415341)
6. **Address Prefix**: Changed to 'N' for NASA
7. **Bech32 HRP**: Changed to "nasa"

---

## 📊 Network Information

### Genesis Block

- **Timestamp**: October 14, 2024
- **Message**: "NASA Coin: To the Moon and Beyond! 14/Oct/2024 Launch of the ultimate meme coin"
- **Reward**: 500,000 NASAPEPE
- **Nonce**: 0
- **Bits**: 0x1d00ffff

### Network Parameters

- **Target Block Time**: 10 minutes
- **Difficulty Adjustment**: Every 2016 blocks
- **Halving Interval**: 210,000 blocks
- **Max Block Size**: 4MB
- **Max Block Weight**: 4,000,000

---

## 🔒 Security

### Best Practices

1. **Firewall**: Only open necessary ports (8334, 18334)
2. **RPC Security**: Use strong passwords and restrict RPC access
3. **Updates**: Keep the software updated
4. **Backups**: Regular backups of wallet and blockchain data
5. **Monitoring**: Monitor logs for suspicious activity

### RPC Security

```ini
# Restrict RPC access
rpcallowip=127.0.0.1
rpcallowip=192.168.1.0/24

# Use strong password
rpcpassword=your_very_strong_password_here

# Bind to specific interface
rpcbind=127.0.0.1:18334
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :8334
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Permission Denied**
   ```bash
   # Fix ownership
   sudo chown -R nasacoin:nasacoin ~/.nasacoin
   ```

3. **Out of Space**
   ```bash
   # Check disk space
   df -h
   
   # Clean up old logs
   sudo journalctl --vacuum-time=7d
   ```

4. **Sync Issues**
   ```bash
   # Reindex blockchain
   nasacoin-cli -reindex
   
   # Or start fresh
   rm -rf ~/.nasacoin/blocks ~/.nasacoin/chainstate
   nasacoind -daemon
   ```

### Log Analysis

```bash
# View recent errors
sudo journalctl -u nasacoind --since "1 hour ago" | grep -i error

# Monitor real-time logs
sudo journalctl -u nasacoind -f

# Check specific log level
nasacoind -debug=net -daemon
```

---

## 📈 Performance Tuning

### System Optimization

```bash
# Increase file descriptor limit
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.rmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Configuration Tuning

```ini
# Increase connection limits
maxconnections=125

# Optimize for SSD
dbcache=1024

# Enable transaction index
txindex=1

# Set appropriate fees
mintxfee=0.00001
minrelaytxfee=0.00001
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/nasacoin-core.git
cd nasacoin-core

# Create development branch
git checkout -b feature/your-feature

# Make changes and test
./build_nasacoin.sh --clean
./deploy_nasacoin.sh build

# Commit and push
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

NASA Coin is a fork of Bitcoin Core for educational and experimental purposes. It is not affiliated with NASA or any official space agency. Use at your own risk.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/nasacoin-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/nasacoin-core/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/nasacoin-core/wiki)

---

**To the Moon and Beyond! 🚀🌙**