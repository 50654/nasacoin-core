#!/bin/bash

# NASA Coin Production Health Check Script
# =======================================

set -e

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

# Load environment variables
if [ -f "production.env" ]; then
    export $(cat production.env | grep -v '^#' | xargs)
fi

print_status "Starting NASA Coin Health Check..."

# Check Docker services
print_status "Checking Docker services..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Docker services are running"
else
    print_error "Some Docker services are not running"
    docker-compose -f docker-compose.prod.yml ps
    exit 1
fi

# Check NASA Coin node
print_status "Checking NASA Coin node..."
if docker-compose -f docker-compose.prod.yml exec -T nasacoin-node nasacoin-cli getblockchaininfo > /dev/null 2>&1; then
    print_success "NASA Coin node is healthy"
else
    print_error "NASA Coin node is not responding"
    exit 1
fi

# Check API server
print_status "Checking API server..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_success "API server is healthy"
else
    print_error "API server is not responding"
    exit 1
fi

# Check dashboard
print_status "Checking dashboard..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Dashboard is healthy"
else
    print_error "Dashboard is not responding"
    exit 1
fi

# Check database
print_status "Checking database..."
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U nasacoin > /dev/null 2>&1; then
    print_success "Database is healthy"
else
    print_error "Database is not responding"
    exit 1
fi

# Check Redis
print_status "Checking Redis..."
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis is not responding"
    exit 1
fi

# Check Prometheus
print_status "Checking Prometheus..."
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    print_success "Prometheus is healthy"
else
    print_warning "Prometheus is not responding"
fi

# Check Grafana
print_status "Checking Grafana..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Grafana is healthy"
else
    print_warning "Grafana is not responding"
fi

# Get detailed health information
print_status "Getting detailed health information..."
curl -s http://localhost:8080/health | jq '.' 2>/dev/null || echo "Health endpoint returned non-JSON response"

print_success "All critical services are healthy!"
