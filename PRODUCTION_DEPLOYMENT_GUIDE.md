# 🚀 NASA Coin Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying NASA Coin to production environments. The system includes both a Bitcoin fork (NASA Coin Core) and an ERC-20 smart contract, along with a full-stack dashboard and API.

## 🏗️ Architecture

### Components

1. **NASA Coin Node** - Custom Bitcoin fork with modified parameters
2. **Smart Contract** - ERC-20 token with mining and staking features
3. **API Server** - RESTful API with caching and rate limiting
4. **Dashboard** - Modern web interface with real-time data
5. **Database** - PostgreSQL for persistent data storage
6. **Cache** - Redis for high-performance caching
7. **Monitoring** - Prometheus, Grafana, and Loki for observability

### Infrastructure

- **Containerization**: Docker and Docker Compose
- **Orchestration**: Kubernetes (optional)
- **Load Balancing**: Nginx with SSL termination
- **Monitoring**: Prometheus + Grafana + Loki
- **Backup**: Automated PostgreSQL backups
- **Security**: Rate limiting, CORS, CSP, HSTS

## 📋 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB+ (16GB+ recommended)
- **Storage**: 100GB+ SSD
- **Network**: Stable internet connection

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- npm 8+
- Git
- OpenSSL
- curl
- jq

### External Services

- **Ethereum RPC**: Alchemy, Infura, or custom node
- **API Keys**: Etherscan, CoinGecko, CoinMarketCap
- **Monitoring**: Sentry (optional)
- **Notifications**: Discord, Telegram (optional)

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nasacoin.git
cd nasacoin
```

### 2. Configure Environment

```bash
# Copy production environment template
cp production.env.example production.env

# Edit configuration
nano production.env
```

### 3. Set Required Variables

```bash
# Required variables
PRIVATE_KEY=your_production_private_key_here
ADMIN_ADDRESS=your_admin_address_here
TREASURY_ADDRESS=your_treasury_address_here
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password
GRAFANA_PASSWORD=your_secure_password
```

### 4. Deploy

```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# Generate production SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nasacoin.key \
  -out ssl/nasacoin.crt \
  -subj "/C=US/ST=State/L=City/O=NASA Coin/OU=IT Department/CN=nasacoin.io"

# Set proper permissions
chmod 600 ssl/nasacoin.key
chmod 644 ssl/nasacoin.crt
```

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8334/tcp  # NASA Coin P2P
ufw allow 18334/tcp # NASA Coin RPC (restrict to localhost)
ufw enable
```

### Database Security

```bash
# Create database user
sudo -u postgres createuser -s nasacoin
sudo -u postgres createdb nasacoin_prod
sudo -u postgres psql -c "ALTER USER nasacoin PASSWORD 'secure_password';"
```

### PoW-Wow Encrypted Tokens (Optional)

NASA Coin API supports a lightweight proof-of-work gate for sensitive endpoints. You can enable stateless, AES-GCM–encrypted PoW tokens to avoid Redis lookups while preserving security.

1) Enable PoW-Wow and set token mode in `production.env`:

```bash
POWWOW_ENABLED=true
POWWOW_PROTECTED_PATHS=/api/nasacoin
POWWOW_TOKEN_MODE=stateless
POWWOW_TOKEN_TTL=120
POWWOW_TOKEN_SECRET="change-this-to-a-long-random-string"
# Optional: custom salt for key derivation (PBKDF2-SHA256)
POWWOW_TOKEN_SALT=nasacoin-powwow-v1
```

2) Clients flow:

- Request a challenge: `GET /api/pow/challenge?resource=/api/nasacoin`
- Solve and mint token: `POST /api/pow/solve` with `{ challengeId, clientNonce }`
- Include the returned token in requests via header `X-PoW-Token: <token>`

3) Notes:

- Set `POWWOW_TOKEN_MODE=redis` to revert to server-stored tokens.
- Rotate `POWWOW_TOKEN_SECRET` carefully (overlap secrets during rotation if needed).
- Tokens are bound to client IP and the protected resource prefix and expire after `POWWOW_TOKEN_TTL` seconds.

## 📊 Monitoring Setup

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'nasacoin-node'
    static_configs:
      - targets: ['nasacoin-node:8334']
    metrics_path: /metrics
    scrape_interval: 30s
```

### Grafana Dashboards

1. Access Grafana: http://localhost:3000
2. Login: admin / [your_password]
3. Import dashboards from `monitoring/grafana/dashboards/`

### Log Aggregation

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f nasacoin-api
```

## 🔄 Maintenance

### Health Checks

```bash
# Run health check script
./scripts/health-check.sh

# Manual health checks
curl http://localhost:8080/health
curl http://localhost/health
```

### Backup and Restore

```bash
# Manual backup
./scripts/backup.sh

# Restore from backup
gunzip -c backups/nasacoin_backup_20240101_120000.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T postgres psql -U nasacoin nasacoin_prod
```

### Updates

```bash
# Update code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 Troubleshooting

### Common Issues

#### NASA Coin Node Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs nasacoin-node

# Check configuration
docker-compose -f docker-compose.prod.yml exec nasacoin-node cat /home/nasacoin/.nasacoin/nasacoin.conf

# Restart node
docker-compose -f docker-compose.prod.yml restart nasacoin-node
```

#### API Server Issues

```bash
# Check API logs
docker-compose -f docker-compose.prod.yml logs nasacoin-api

# Test API directly
curl -X GET http://localhost:8080/health

# Check database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U nasacoin -d nasacoin_prod -c "SELECT 1;"
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U nasacoin

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

### Performance Issues

#### High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Slow API Response

```bash
# Check Redis cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Clear cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  nasacoin-api:
    deploy:
      replicas: 3
    environment:
      - LOAD_BALANCER_ENABLED=true
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream nasacoin_api {
    server nasacoin-api-1:8080;
    server nasacoin-api-2:8080;
    server nasacoin-api-3:8080;
}
```

## 🔐 Security Best Practices

### 1. Network Security

- Use VPN for administrative access
- Implement IP whitelisting for RPC access
- Enable DDoS protection
- Use WAF (Web Application Firewall)

### 2. Application Security

- Regular security updates
- Input validation and sanitization
- Rate limiting and DDoS protection
- Secure headers (CSP, HSTS, etc.)

### 3. Data Security

- Encrypt sensitive data at rest
- Use secure communication (TLS)
- Regular security audits
- Access logging and monitoring

### 4. Operational Security

- Principle of least privilege
- Regular backup testing
- Incident response plan
- Security training for team

## 📞 Support

### Getting Help

1. **Documentation**: Check this guide first
2. **Logs**: Review application and system logs
3. **Health Checks**: Run health check scripts
4. **Community**: Join our Discord/Telegram
5. **Issues**: Report bugs on GitHub

### Emergency Contacts

- **Technical Lead**: [email]
- **DevOps Team**: [email]
- **Security Team**: [email]

## 🎯 Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_blocks_height ON blocks(height);
CREATE INDEX idx_mining_rewards_address ON mining_rewards(address);
```

### Caching Strategy

```javascript
// Redis caching configuration
const cacheConfig = {
  ttl: 300, // 5 minutes
  maxMemory: '256mb',
  evictionPolicy: 'allkeys-lru'
};
```

### API Optimization

- Implement connection pooling
- Use compression (gzip)
- Enable HTTP/2
- Optimize database queries

## 📊 Monitoring and Alerting

### Key Metrics

- **System**: CPU, Memory, Disk, Network
- **Application**: Response time, Error rate, Throughput
- **Database**: Connection count, Query time, Lock waits
- **Blockchain**: Block height, Hash rate, Difficulty

### Alerting Rules

```yaml
# monitoring/alerts.yml
groups:
  - name: nasacoin
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] SSL certificates generated
- [ ] Database backups created
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Rollback plan prepared

### Deployment

- [ ] Code deployed to staging
- [ ] Staging tests passed
- [ ] Production deployment executed
- [ ] Health checks passed
- [ ] Monitoring configured
- [ ] Team notified

### Post-deployment

- [ ] Performance monitoring active
- [ ] Error tracking enabled
- [ ] Backup schedule verified
- [ ] Documentation updated
- [ ] Team training completed

---

## 🌟 Conclusion

This production deployment guide provides everything needed to deploy and maintain NASA Coin in a production environment. Follow the security best practices, monitor the system closely, and maintain regular backups to ensure a successful deployment.

**To the Moon and Beyond! 🚀🌙**
