#!/bin/bash

# NASA Coin Production Deployment Script
# =====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Trim leading and trailing whitespace from a string
trim() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "$value"
}

# Load environment variables from a .env style file while preserving spaces
load_env_file() {
    local env_file="$1"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file '$env_file' not found."
        exit 1
    fi

    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"

        # Skip empty lines and comments (allow leading whitespace)
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        if [[ "$line" != *=* ]]; then
            print_warning "Skipping malformed line in $env_file: $line"
            continue
        fi

        local key="${line%%=*}"
        local value="${line#*=}"

        key="$(trim "$key")"
        value="$(trim "$value")"

        if [[ -z "$key" ]]; then
            print_warning "Skipping line with empty key in $env_file"
            continue
        fi

        if ! [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            print_warning "Skipping invalid environment key '$key' in $env_file"
            continue
        fi

        # Remove surrounding quotes if present
        if [[ ${#value} -ge 2 ]]; then
            if [[ ( "${value:0:1}" == '"' && "${value: -1}" == '"' ) || ( "${value:0:1}" == "'" && "${value: -1}" == "'" ) ]]; then
                value="${value:1:-1}"
            fi
        fi

        export "${key}=${value}"
    done < "$env_file"
}

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
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if production environment file exists
if [ ! -f "production.env" ]; then
    print_error "Production environment file not found. Please create production.env first."
    exit 1
fi

# Load environment variables
load_env_file "production.env"

print_status "Starting NASA Coin Production Deployment..."
print_status "Environment: $NODE_ENV"
print_status "Network: $NETWORK"

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "All prerequisites are installed"

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p backups
mkdir -p ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Set proper permissions
chmod 755 logs backups ssl
chmod 755 monitoring/grafana/dashboards
chmod 755 monitoring/grafana/datasources

print_success "Directories created"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

print_success "Dependencies installed"

# Compile smart contracts
print_status "Compiling smart contracts..."
npx hardhat compile

print_success "Smart contracts compiled"

# Run tests
print_status "Running production tests..."
npm test

if [ $? -eq 0 ]; then
    print_success "All tests passed"
else
    print_error "Tests failed. Deployment aborted."
    exit 1
fi

# Build Docker images
print_status "Building Docker images..."

# Build NASA Coin node image
print_status "Building NASA Coin node image..."
docker build -f Dockerfile.prod -t nasacoin-node:latest .

# Build API server image
print_status "Building API server image..."
docker build -f Dockerfile.api -t nasacoin-api:latest .

# Build dashboard image
print_status "Building dashboard image..."
docker build -f Dockerfile.dashboard -t nasacoin-dashboard:latest .

print_success "Docker images built"

# Create production configuration files
print_status "Creating production configuration files..."

# Create nginx configuration
cat > nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Upstream API server
    upstream nasacoin_api {
        server nasacoin-api:8080;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name _;
        
        # SSL configuration
        ssl_certificate /etc/ssl/certs/nasacoin.crt;
        ssl_certificate_key /etc/ssl/private/nasacoin.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nasacoin_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://nasacoin_api/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static files
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}
NGINX_EOF

# Create Prometheus configuration
cat > monitoring/prometheus.yml << 'PROMETHEUS_EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'nasacoin-node'
    static_configs:
      - targets: ['nasacoin-node:8334']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'nasacoin-api'
    static_configs:
      - targets: ['nasacoin-api:8080']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
PROMETHEUS_EOF

# Create Loki configuration
cat > monitoring/loki.yml << 'LOKI_EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
LOKI_EOF

# Create Promtail configuration
cat > monitoring/promtail.yml << 'PROMTAIL_EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nasacoin-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: nasacoin
          __path__: /var/log/nasacoin/*.log
    pipeline_stages:
      - json:
          expressions:
            timestamp: time
            level: level
            message: msg
      - timestamp:
          source: timestamp
          format: RFC3339
      - labels:
          level:
PROMTAIL_EOF

print_success "Configuration files created"

# Generate SSL certificates (self-signed for development)
print_status "Generating SSL certificates..."
if [ ! -f "ssl/nasacoin.crt" ] || [ ! -f "ssl/nasacoin.key" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/nasacoin.key \
        -out ssl/nasacoin.crt \
        -subj "/C=US/ST=State/L=City/O=NASA Coin/OU=IT Department/CN=nasacoin.io"
    
    chmod 600 ssl/nasacoin.key
    chmod 644 ssl/nasacoin.crt
    print_success "SSL certificates generated"
else
    print_warning "SSL certificates already exist, skipping generation"
fi

# Create backup script
print_status "Creating backup script..."
cat > scripts/backup.sh << 'BACKUP_EOF'
#!/bin/bash

# NASA Coin Backup Script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nasacoin_backup_$DATE.sql"

# Create backup
pg_dump -h postgres -U nasacoin nasacoin_prod > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove old backups (keep last 30 days)
find $BACKUP_DIR -name "nasacoin_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
BACKUP_EOF

chmod +x scripts/backup.sh

print_success "Backup script created"

# Start services
print_status "Starting production services..."

# Stop any existing containers
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

print_success "Services started"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check NASA Coin node
if docker-compose -f docker-compose.prod.yml exec -T nasacoin-node nasacoin-cli getblockchaininfo > /dev/null 2>&1; then
    print_success "NASA Coin node is healthy"
else
    print_error "NASA Coin node is not responding"
fi

# Check API server
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_success "API server is healthy"
else
    print_error "API server is not responding"
fi

# Check dashboard
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Dashboard is healthy"
else
    print_error "Dashboard is not responding"
fi

# Deploy smart contracts
print_status "Deploying smart contracts to $NETWORK..."

# Set up environment for contract deployment
export PRIVATE_KEY=$PRIVATE_KEY
export ETHEREUM_RPC_URL=$ETHEREUM_RPC_URL

# Deploy contracts
npx hardhat run scripts/deploy.js --network $NETWORK

print_success "Smart contracts deployed"

# Set up monitoring
print_status "Setting up monitoring..."

# Create Grafana dashboards
cat > monitoring/grafana/datasources/prometheus.yml << 'GRAFANA_EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
GRAFANA_EOF

print_success "Monitoring configured"

# Final checks
print_status "Performing final checks..."

# Check all services are running
SERVICES=("nasacoin-node" "nasacoin-api" "nasacoin-dashboard" "postgres" "redis" "prometheus" "grafana")
for service in "${SERVICES[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Display access information
print_success "NASA Coin Production Deployment Complete!"
echo ""
echo "?? Access Information:"
echo "  Dashboard: https://localhost"
echo "  API: http://localhost:8080"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3000 (admin/password)"
echo ""
echo "?? Monitoring:"
echo "  Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Status: docker-compose -f docker-compose.prod.yml ps"
echo "  Health: curl http://localhost:8080/health"
echo ""
echo "?? Management:"
echo "  Stop: docker-compose -f docker-compose.prod.yml down"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  Update: ./scripts/deploy-production.sh"
echo ""
echo "?? To the Moon and Beyond!"
