#!/bin/bash

set -e

echo "🚀 NASA Coin Bitcoin Source Setup"
echo "================================="

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
if [ ! -f "README_NASA_COIN.md" ]; then
    print_error "Please run this script from the NASA Coin workspace root directory."
    exit 1
fi

# Check if bitcoin-core directory already exists
if [ -d "bitcoin-core" ]; then
    print_warning "bitcoin-core directory already exists."
    read -p "Do you want to remove it and clone fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing existing bitcoin-core directory..."
        rm -rf bitcoin-core
    else
        print_status "Keeping existing bitcoin-core directory."
        exit 0
    fi
fi

# Clone Bitcoin Core source code
print_status "Cloning Bitcoin Core source code..."
git clone https://github.com/bitcoin/bitcoin.git bitcoin-core

if [ $? -ne 0 ]; then
    print_error "Failed to clone Bitcoin Core repository."
    exit 1
fi

cd bitcoin-core

# Checkout a stable version (latest release)
print_status "Checking out latest stable release..."
LATEST_TAG=$(git describe --tags --abbrev=0)
print_status "Latest stable tag: $LATEST_TAG"
git checkout $LATEST_TAG

if [ $? -ne 0 ]; then
    print_error "Failed to checkout latest stable release."
    exit 1
fi

print_success "Bitcoin Core source code setup complete!"
print_status "Latest version: $LATEST_TAG"
print_status "Source location: bitcoin-core/"
print_status ""
print_status "Next steps:"
print_status "1. Run ./build_nasacoin.sh to build NASA Coin"
print_status "2. Or push a tag to trigger the GitHub Actions release workflow"
print_status ""
print_status "To create a release:"
print_status "  git tag v1.0.0"
print_status "  git push origin v1.0.0"