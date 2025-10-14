#!/bin/bash

set -e

echo "🚀 NASA Coin Deployment Script"
echo "=============================="

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
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This is not recommended for security reasons."
fi

# Function to install dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            libtool \
            autotools-dev \
            automake \
            pkg-config \
            libssl-dev \
            libevent-dev \
            bsdmainutils \
            libboost-all-dev \
            libdb-dev \
            libdb++-dev \
            git \
            wget \
            curl \
            docker.io \
            docker-compose
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            libtool \
            autotools-dev \
            automake \
            pkg-config \
            openssl-devel \
            libevent-devel \
            boost-devel \
            db4-devel \
            git \
            wget \
            curl \
            docker \
            docker-compose
    else
        print_error "Unsupported package manager. Please install dependencies manually."
        exit 1
    fi
    
    print_success "Dependencies installed successfully!"
}

# Function to build NASA Coin
build_nasacoin() {
    print_status "Building NASA Coin..."
    
    if [ ! -d "bitcoin-core" ]; then
        print_error "Bitcoin Core source not found. Please run the build script first."
        exit 1
    fi
    
    cd bitcoin-core
    
    # Clean and configure
    make clean || true
    ./configure --disable-wallet --disable-gui --prefix=/usr/local
    
    # Build
    make -j$(nproc)
    
    # Install
    sudo make install
    sudo ldconfig
    
    cd ..
    print_success "NASA Coin built and installed successfully!"
}

# Function to create system user
create_user() {
    print_status "Creating NASA Coin system user..."
    
    if ! id "nasacoin" &>/dev/null; then
        sudo useradd -m -s /bin/bash nasacoin
        print_success "User 'nasacoin' created successfully!"
    else
        print_warning "User 'nasacoin' already exists."
    fi
}

# Function to setup configuration
setup_config() {
    print_status "Setting up NASA Coin configuration..."
    
    sudo mkdir -p /home/nasacoin/.nasacoin
    sudo cp nasacoin.conf /home/nasacoin/.nasacoin/
    sudo chown -R nasacoin:nasacoin /home/nasacoin/.nasacoin
    sudo chmod 600 /home/nasacoin/.nasacoin/nasacoin.conf
    
    print_success "Configuration setup complete!"
}

# Function to create systemd service
create_service() {
    print_status "Creating systemd service..."
    
    sudo tee /etc/systemd/system/nasacoind.service > /dev/null <<EOF
[Unit]
Description=NASA Coin Node
After=network.target

[Service]
Type=forking
User=nasacoin
Group=nasacoin
ExecStart=/usr/local/bin/bitcoind -daemon -conf=/home/nasacoin/.nasacoin/nasacoin.conf -datadir=/home/nasacoin/.nasacoin
ExecStop=/usr/local/bin/bitcoin-cli -conf=/home/nasacoin/.nasacoin/nasacoin.conf stop
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable nasacoind
    
    print_success "Systemd service created and enabled!"
}

# Function to start NASA Coin
start_nasacoin() {
    print_status "Starting NASA Coin service..."
    
    sudo systemctl start nasacoind
    
    # Wait a moment for the service to start
    sleep 5
    
    if systemctl is-active --quiet nasacoind; then
        print_success "NASA Coin service started successfully!"
        
        # Show status
        print_status "Service status:"
        sudo systemctl status nasacoind --no-pager
        
        # Show blockchain info
        print_status "Blockchain info:"
        sudo -u nasacoin /usr/local/bin/bitcoin-cli -conf=/home/nasacoin/.nasacoin/nasacoin.conf getblockchaininfo
        
    else
        print_error "Failed to start NASA Coin service!"
        print_status "Check logs with: sudo journalctl -u nasacoind -f"
        exit 1
    fi
}

# Function to setup Docker deployment
setup_docker() {
    print_status "Setting up Docker deployment..."
    
    if command -v docker &> /dev/null; then
        # Build Docker image
        docker build -t nasacoin:latest .
        
        # Create docker-compose override for production
        cat > docker-compose.prod.yml <<EOF
version: '3.8'

services:
  nasacoin-node:
    image: nasacoin:latest
    container_name: nasacoin-node-prod
    ports:
      - "8334:8334"
      - "18334:18334"
    volumes:
      - nasacoin-data:/home/nasacoin/.nasacoin
    environment:
      - NASA_COIN_NETWORK=mainnet
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  nasacoin-data:
    driver: local
EOF
        
        print_success "Docker setup complete!"
        print_status "To start with Docker: docker-compose -f docker-compose.prod.yml up -d"
    else
        print_warning "Docker not found. Skipping Docker setup."
    fi
}

# Main deployment function
main() {
    case "${1:-all}" in
        "deps")
            install_dependencies
            ;;
        "build")
            build_nasacoin
            ;;
        "user")
            create_user
            ;;
        "config")
            setup_config
            ;;
        "service")
            create_service
            ;;
        "start")
            start_nasacoin
            ;;
        "docker")
            setup_docker
            ;;
        "all")
            install_dependencies
            build_nasacoin
            create_user
            setup_config
            create_service
            start_nasacoin
            setup_docker
            ;;
        *)
            echo "Usage: $0 {deps|build|user|config|service|start|docker|all}"
            echo ""
            echo "Options:"
            echo "  deps     - Install system dependencies"
            echo "  build    - Build NASA Coin from source"
            echo "  user     - Create nasacoin system user"
            echo "  config   - Setup configuration files"
            echo "  service  - Create systemd service"
            echo "  start    - Start NASA Coin service"
            echo "  docker   - Setup Docker deployment"
            echo "  all      - Run all steps (default)"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully!"
    print_status "NASA Coin is now running!"
    print_status "RPC endpoint: http://localhost:18334"
    print_status "P2P port: 8334"
    print_status "Check logs: sudo journalctl -u nasacoind -f"
}

# Run main function
main "$@"