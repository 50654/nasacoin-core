#!/bin/bash

# NASA Coin Dashboard Deployment Script
# Enhanced version with advanced features

echo "🚀 NASA Coin Dashboard - Enhanced Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "This script should not be run as root for security reasons"
   exit 1
fi

# Create deployment directory
DEPLOY_DIR="$HOME/nasacoin-dashboard"
print_status "Creating deployment directory: $DEPLOY_DIR"

if [ -d "$DEPLOY_DIR" ]; then
    print_warning "Directory already exists. Backing up..."
    mv "$DEPLOY_DIR" "$DEPLOY_DIR.backup.$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Copy dashboard files
print_status "Copying dashboard files..."
cp -r /tmp/Wbaker7702/nasacoin-core/* .

# Set proper permissions
print_status "Setting file permissions..."
chmod 644 *.html *.css *.js *.md
chmod 755 *.sh

# Check for required dependencies
print_status "Checking system dependencies..."

# Check for Python3 (for simple HTTP server)
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is required but not installed"
    exit 1
fi

# Check for Node.js (optional, for advanced features)
if command -v node &> /dev/null; then
    print_success "Node.js found: $(node --version)"
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
else
    print_warning "Node.js not found. Some advanced features may not work."
fi

# Create configuration file
print_status "Creating configuration file..."
cat > config.js << 'EOF'
// NASA Coin Dashboard Configuration
const CONFIG = {
    // RPC Configuration
    RPC_URL: 'http://localhost:18334',
    RPC_USER: 'nasauser',
    RPC_PASSWORD: 'supersecurepassword',
    
    // Dashboard Settings
    UPDATE_INTERVAL: 5000, // 5 seconds
    MINING_UPDATE_INTERVAL: 10000, // 10 seconds
    PRICE_UPDATE_INTERVAL: 30000, // 30 seconds
    
    // Network Settings
    NETWORK_NAME: 'NASA Coin Mainnet',
    NETWORK_PORT: 8334,
    RPC_PORT: 18334,
    MAX_SUPPLY: 5000000,
    BLOCK_REWARD: 500000,
    
    // Feature Flags
    ENABLE_MINING: true,
    ENABLE_WALLET: true,
    ENABLE_TRADING: true,
    ENABLE_ALERTS: true,
    ENABLE_CHARTS: true,
    
    // Advanced Features
    AUTO_MINING: false,
    POOL_MINING: false,
    HARDWARE_ACCELERATION: false,
    
    // UI Settings
    THEME: 'dark',
    ANIMATIONS: true,
    SOUND_ALERTS: false,
    
    // Security Settings
    ENABLE_2FA: false,
    SESSION_TIMEOUT: 3600000, // 1 hour
    
    // API Keys (set these for full functionality)
    COINGECKO_API_KEY: '',
    COINMARKETCAP_API_KEY: '',
    INFURA_PROJECT_ID: '',
    
    // Wallet Integration
    SUPPORTED_WALLETS: [
        'MetaMask',
        'Coinbase',
        'WalletConnect',
        'Trust Wallet',
        'Phantom',
        'Ledger'
    ]
};

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
EOF

# Create systemd service file (optional)
print_status "Creating systemd service file..."
cat > nasacoin-dashboard.service << EOF
[Unit]
Description=NASA Coin Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create startup script
print_status "Creating startup script..."
cat > start-dashboard.sh << 'EOF'
#!/bin/bash

# NASA Coin Dashboard Startup Script

DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DASHBOARD_DIR"

echo "🚀 Starting NASA Coin Dashboard..."
echo "Dashboard directory: $DASHBOARD_DIR"
echo "Access URL: http://localhost:8080"
echo "Press Ctrl+C to stop"

# Start the web server
python3 -m http.server 8080
EOF

chmod +x start-dashboard.sh

# Create stop script
cat > stop-dashboard.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping NASA Coin Dashboard..."
pkill -f "python3 -m http.server 8080"
echo "Dashboard stopped."
EOF

chmod +x stop-dashboard.sh

# Create update script
cat > update-dashboard.sh << 'EOF'
#!/bin/bash

echo "🔄 Updating NASA Coin Dashboard..."

# Backup current version
if [ -d "backup" ]; then
    rm -rf backup.old
    mv backup backup.old
fi
mkdir -p backup
cp -r *.html *.css *.js backup/

# Here you would typically pull from git or download updates
echo "Update functionality can be implemented here"
echo "Current version backed up to ./backup/"
EOF

chmod +x update-dashboard.sh

# Create README for deployment
print_status "Creating deployment README..."
cat > DEPLOYMENT_README.md << 'EOF'
# NASA Coin Dashboard - Deployment Guide

## 🚀 Quick Start

1. **Start the dashboard:**
   ```bash
   ./start-dashboard.sh
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:8080
   ```

3. **Stop the dashboard:**
   ```bash
   ./stop-dashboard.sh
   ```

## ⚙️ Configuration

Edit `config.js` to customize:
- RPC connection settings
- Feature toggles
- UI preferences
- API keys

## 🔧 Advanced Setup

### System Service (Optional)
To run as a system service:

```bash
sudo cp nasacoin-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nasacoin-dashboard
sudo systemctl start nasacoin-dashboard
```

### Nginx Reverse Proxy (Optional)
For production deployment with SSL:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Features

### Enhanced Mining Dashboard
- Real-time hash rate monitoring
- Advanced mining statistics
- CPU usage tracking
- Mining efficiency metrics
- Pool mining support
- Auto-mining mode

### Multi-Wallet Integration
- MetaMask support
- Coinbase Wallet
- WalletConnect
- Trust Wallet
- Phantom Wallet
- Ledger Hardware Wallet
- QR code generation
- Balance tracking

### Advanced Market Analytics
- Real-time price tracking
- Interactive charts
- Market comparison
- Price alerts
- Historical data

### Smart Alerts System
- Price alerts
- Mining alerts
- Wallet alerts
- Network alerts
- Custom notifications

## 🛠️ Troubleshooting

### Common Issues

1. **Dashboard won't load:**
   - Check if port 8080 is available
   - Verify Python3 is installed
   - Check firewall settings

2. **Mining not working:**
   - Ensure NASA Coin node is running
   - Verify RPC credentials in config.js
   - Check RPC port accessibility

3. **Wallet connection fails:**
   - Install required wallet extensions
   - Check browser compatibility
   - Verify network settings

### Logs and Debugging

- Browser console: F12 → Console
- Network requests: F12 → Network
- Server logs: Check terminal output

## 🔒 Security

- Never expose RPC credentials publicly
- Use HTTPS in production
- Keep wallet private keys secure
- Regular security updates

## 📞 Support

For issues and support:
- Check the troubleshooting section
- Review browser console errors
- Verify NASA Coin node status
EOF

# Final setup
print_status "Finalizing deployment..."

# Create logs directory
mkdir -p logs

# Set final permissions
chmod -R 755 .
chmod 644 *.md *.json *.html *.css *.js

print_success "Deployment completed successfully!"
echo ""
echo "📍 Dashboard Location: $DEPLOY_DIR"
echo "🌐 Start Command: ./start-dashboard.sh"
echo "🔗 Access URL: http://localhost:8080"
echo ""
print_status "Next steps:"
echo "1. Configure your NASA Coin node RPC settings in config.js"
echo "2. Run ./start-dashboard.sh to start the dashboard"
echo "3. Open http://localhost:8080 in your browser"
echo ""
print_warning "Remember to configure RPC credentials in config.js before starting!"

