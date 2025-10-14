#!/bin/bash

set -e

echo "🚀 NASA Coin Build Script"
echo "========================="

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

# Check if we're in the right directory
if [ ! -d "bitcoin-core" ]; then
    print_error "bitcoin-core directory not found. Please run this script from the workspace root."
    exit 1
fi

if [ ! -f "bitcoin-core/autogen.sh" ]; then
    print_error "Bitcoin source not found in bitcoin-core directory."
    print_error "Please clone Bitcoin source code into the bitcoin-core/ directory first."
    exit 1
fi

print_status "Building NASA Coin from Bitcoin source..."

cd bitcoin-core

# Clean previous build if requested
if [ "$1" = "--clean" ]; then
    print_status "Cleaning previous build..."
    make clean
fi

# Configure build
print_status "Configuring build..."
./configure \
  --disable-wallet \
  --disable-gui \
  --enable-debug \
  --with-incompatible-bdb \
  --without-miniupnpc \
  --without-natpmp \
  --without-zmq \
  --without-qrencode

# Build
print_status "Building NASA Coin (this may take a while)..."
make -j$(nproc)

# Check if build was successful
if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
    
    # Show binary information
    print_status "Built binaries:"
    ls -la src/bitcoin* | grep -E "(bitcoind|bitcoin-cli|bitcoin-tx|bitcoin-util)"
    
    # Test the daemon
    print_status "Testing NASA Coin daemon..."
    ./src/bitcoind --version
    
    print_success "NASA Coin is ready to use!"
    print_status "To start the daemon: ./src/bitcoind -daemon"
    print_status "To use CLI: ./src/bitcoin-cli"
    print_status "Note: Binaries are built as bitcoind/bitcoin-cli but will be renamed to nasacoind/nasacoin-cli in releases"
    
else
    print_error "Build failed!"
    exit 1
fi