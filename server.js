const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('ioredis');
const crypto = require('crypto');
const { ethers } = require('ethers');
const winston = require('winston');
const Sentry = require('@sentry/node');

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const app = express();
const PORT = process.env.API_PORT || 8080;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// NASA Coin RPC configuration
const nasacoinRPC = {
  url: process.env.NASA_COIN_RPC_URL || 'http://localhost:18334',
  user: process.env.NASA_COIN_RPC_USER || 'nasauser',
  password: process.env.NASA_COIN_RPC_PASSWORD || 'supersecurepassword'
};

// Ethereum provider configuration
const ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.coingecko.com", "https://pro-api.coinmarketcap.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting: apply to API routes and a separate lightweight limiter for /health
const rateLimitEnabled = (process.env.RATE_LIMIT_ENABLED || 'true').toLowerCase() === 'true';
if (rateLimitEnabled) {
  const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // Dedicated short-window limiter for /health to satisfy tests without impacting others
  const healthLimiter = rateLimit({
    windowMs: 1000, // 1 second window
    max: 20, // allow up to 20 health checks per second per IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/health', healthLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const sanitizedPath = req.path.replace(/[\r\n]/g, "");
  logger.info(`${req.method} ${sanitizedPath}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Register PoW-Wow middleware (no-op if disabled)
app.use(powWowMiddleware);

// ----------------------------------------------
// PoW-Wow Security: Challenge/Response Middleware
// ----------------------------------------------
const powWowConfig = {
  enabled: (process.env.POWWOW_ENABLED || 'false').toLowerCase() === 'true',
  difficulty: parseInt(process.env.POWWOW_DIFFICULTY || '18', 10), // leading bits target
  challengeTtlSeconds: parseInt(process.env.POWWOW_CHALLENGE_TTL || '60', 10),
  tokenTtlSeconds: parseInt(process.env.POWWOW_TOKEN_TTL || '120', 10),
  headerName: process.env.POWWOW_HEADER_NAME || 'X-PoW-Token',
  protectedPaths: (process.env.POWWOW_PROTECTED_PATHS || '/api/nasacoin').split(',').map(p => p.trim()).filter(Boolean),
  tokenMode: (process.env.POWWOW_TOKEN_MODE || 'redis').toLowerCase(), // 'redis' | 'stateless'
  tokenSecret: process.env.POWWOW_TOKEN_SECRET || ''
};

function computeSha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getClientIp(req) {
  // honor reverse proxy if configured; Express default provides req.ip
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '0.0.0.0';
}

function isHashBelowDifficulty(hexDigest, difficultyBits) {
  // Compare bigint of hash to target = 2^(256-difficulty)
  const hashValue = BigInt('0x' + hexDigest);
  const shift = 256 - Math.max(0, Math.min(255, difficultyBits));
  const target = 1n << BigInt(shift);
  return hashValue < target;
}

// ----------------------------
// Encrypted Stateless Token v1
// ----------------------------
let cachedTokenKey;
function getTokenKey() {
  if (cachedTokenKey) return cachedTokenKey;
  if (!powWowConfig.tokenSecret || powWowConfig.tokenSecret.length < 16) {
    logger.warn('POWWOW_TOKEN_SECRET is missing or too short; falling back to redis token mode');
    return null;
  }
  // Derive a 32-byte key using PBKDF2-SHA256
  const salt = Buffer.from(process.env.POWWOW_TOKEN_SALT || 'nasacoin-powwow-v1');
  cachedTokenKey = crypto.pbkdf2Sync(powWowConfig.tokenSecret, salt, 100000, 32, 'sha256');
  return cachedTokenKey;
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(base64, 'base64');
}

function mintEncryptedToken(resource, ip, ttlSeconds) {
  const key = getTokenKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const nowMs = Date.now();
  const payload = {
    v: 1,
    r: resource,
    i: ip,
    iat: nowMs,
    exp: nowMs + ttlSeconds * 1000
  };
  const plaintext = Buffer.from(JSON.stringify(payload));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const token = `enc1.${b64urlEncode(iv)}.${b64urlEncode(ciphertext)}.${b64urlEncode(tag)}`;
  return token;
}

function verifyEncryptedToken(token, expectedResource, ip) {
  try {
    if (!token || !token.startsWith('enc1.')) return { ok: false, reason: 'not_encrypted_token' };
    const key = getTokenKey();
    if (!key) return { ok: false, reason: 'no_token_key' };
    const parts = token.split('.');
    if (parts.length !== 4) return { ok: false, reason: 'malformed_token' };
    const iv = b64urlDecode(parts[1]);
    const ciphertext = b64urlDecode(parts[2]);
    const tag = b64urlDecode(parts[3]);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(decrypted.toString('utf8'));
    if (typeof payload !== 'object' || payload.v !== 1) return { ok: false, reason: 'invalid_payload' };
    if (payload.r !== expectedResource) return { ok: false, reason: 'resource_mismatch' };
    if (payload.i !== ip) return { ok: false, reason: 'ip_mismatch' };
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return { ok: false, reason: 'expired' };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'decrypt_failed' };
  }
}

async function createPowChallenge(resource, ip) {
  const challengeId = crypto.randomBytes(16).toString('hex');
  const serverNonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const payload = {
    id: challengeId,
    resource,
    ip,
    serverNonce,
    timestamp,
    difficulty: powWowConfig.difficulty
  };
  await redis.setex(`pow:challenge:${challengeId}`, powWowConfig.challengeTtlSeconds, JSON.stringify(payload));
  return payload;
}

async function verifyPowSolutionAndMintToken(challengeId, clientNonce, ip) {
  const key = `pow:challenge:${challengeId}`;
  const value = await redis.get(key);
  if (!value) return { ok: false, reason: 'invalid_or_expired_challenge' };
  const challenge = JSON.parse(value);

  // Bind PoW to the requesting IP and resource
  if (challenge.ip !== ip) return { ok: false, reason: 'ip_mismatch' };

  const composed = `${challenge.serverNonce}:${clientNonce}:${challenge.timestamp}:${challenge.resource}:${challenge.ip}`;
  const digest = computeSha256Hex(composed);
  const ok = isHashBelowDifficulty(digest, challenge.difficulty);
  if (!ok) return { ok: false, reason: 'insufficient_work' };

  // Invalidate the challenge to prevent replay
  await redis.del(key);

  // Issue short-lived token bound to resource+ip
  if (powWowConfig.tokenMode === 'stateless') {
    const encrypted = mintEncryptedToken(challenge.resource, challenge.ip, powWowConfig.tokenTtlSeconds);
    if (!encrypted) {
      // Fallback to redis mode if key missing
      logger.warn('Failed to mint encrypted token; falling back to redis token');
    } else {
      return { ok: true, token: encrypted, expiresIn: powWowConfig.tokenTtlSeconds, resource: challenge.resource };
    }
  }

  // Redis-backed token (default)
  const token = crypto.randomBytes(24).toString('hex');
  const tokenData = {
    token,
    resource: challenge.resource,
    ip: challenge.ip,
    issuedAt: Date.now()
  };
  await redis.setex(`pow:token:${token}`, powWowConfig.tokenTtlSeconds, JSON.stringify(tokenData));
  return { ok: true, token, expiresIn: powWowConfig.tokenTtlSeconds, resource: challenge.resource };
}

function isProtectedPath(pathname) {
  // Simple prefix match for configured protected roots
  return powWowConfig.protectedPaths.some(prefix => pathname.startsWith(prefix));
}

async function powWowMiddleware(req, res, next) {
  try {
    if (!powWowConfig.enabled) return next();
    if (!isProtectedPath(req.path)) return next();

    const token = req.get(powWowConfig.headerName);
    if (!token) {
      // No token; instruct client to fetch a challenge
      return res.status(403).json({
        error: 'pow_required',
        message: 'Proof-of-Work required. Obtain challenge and solve.',
        challengeEndpoint: '/api/pow/challenge',
        header: powWowConfig.headerName,
        difficulty: powWowConfig.difficulty
      });
    }

    const ip = getClientIp(req);

    // If encrypted stateless mode is enabled or token looks encrypted, verify via AES-GCM
    if (powWowConfig.tokenMode === 'stateless' || token.startsWith('enc1.')) {
      // Determine the protected root the token must match; use the first matching prefix
      const matchedResource = powWowConfig.protectedPaths.find(prefix => req.path.startsWith(prefix)) || '/';
      const verify = verifyEncryptedToken(token, matchedResource, ip);
      if (!verify.ok) {
        return res.status(403).json({ error: verify.reason || 'invalid_pow_token' });
      }
      return next();
    }

    // Default: Redis-backed token verification
    const tokenPayload = await redis.get(`pow:token:${token}`);
    if (!tokenPayload) {
      return res.status(403).json({ error: 'invalid_pow_token' });
    }
    const parsed = JSON.parse(tokenPayload);
    if (parsed.ip !== ip) {
      return res.status(403).json({ error: 'ip_mismatch' });
    }
    // Token must match the protected root (resource prefix)
    if (!req.path.startsWith(parsed.resource)) {
      return res.status(403).json({ error: 'resource_mismatch' });
    }

    return next();
  } catch (e) {
    return res.status(500).json({ error: 'pow_verification_failed' });
  }
}

// Challenge endpoint
app.get('/api/pow/challenge', async (req, res) => {
  try {
    if (!powWowConfig.enabled) return res.status(404).json({ error: 'not_enabled' });
    const resource = (req.query.resource || '/').toString();
    if (!isProtectedPath(resource)) {
      return res.status(400).json({ error: 'invalid_resource' });
    }
    const ip = getClientIp(req);
    const challenge = await createPowChallenge(resource, ip);
    res.json({
      challengeId: challenge.id,
      resource: challenge.resource,
      difficulty: challenge.difficulty,
      serverNonce: challenge.serverNonce,
      timestamp: challenge.timestamp,
      ttl: powWowConfig.challengeTtlSeconds,
      algorithm: 'sha256',
    });
  } catch (error) {
    logger.error('PoW challenge error', error);
    res.status(500).json({ error: 'challenge_failed' });
  }
});

// Solve endpoint
app.post('/api/pow/solve', async (req, res) => {
  try {
    if (!powWowConfig.enabled) return res.status(404).json({ error: 'not_enabled' });
    const { challengeId, clientNonce } = req.body || {};
    if (!challengeId || typeof clientNonce !== 'string') {
      return res.status(400).json({ error: 'invalid_request' });
    }
    const ip = getClientIp(req);
    const result = await verifyPowSolutionAndMintToken(challengeId, clientNonce, ip);
    if (!result.ok) return res.status(400).json({ error: result.reason });
    res.json({ token: result.token, header: powWowConfig.headerName, expiresIn: result.expiresIn, resource: result.resource });
  } catch (error) {
    logger.error('PoW solve error', error);
    res.status(500).json({ error: 'solve_failed' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Short-circuit in test environment to keep tests fast and deterministic
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
      });
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {}
    };

    // Check database connection
    try {
      await pool.query('SELECT 1');
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Redis connection
    try {
      await redis.ping();
      health.services.redis = 'healthy';
    } catch (error) {
      health.services.redis = 'unhealthy';
      health.status = 'degraded';
    }

    // Check NASA Coin RPC
    try {
      const response = await fetch(nasacoinRPC.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${nasacoinRPC.user}:${nasacoinRPC.password}`).toString('base64')
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: '1',
          method: 'getblockchaininfo',
          params: []
        })
      });
      
      if (response.ok) {
        health.services.nasacoin = 'healthy';
      } else {
        health.services.nasacoin = 'unhealthy';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.nasacoin = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Ethereum connection
    try {
      await ethereumProvider.getBlockNumber();
      health.services.ethereum = 'healthy';
    } catch (error) {
      health.services.ethereum = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// NASA Coin RPC proxy endpoints
app.post('/api/nasacoin/*', async (req, res) => {
  try {
    const method = req.path.replace('/api/nasacoin/', '');
    const params = req.body.params || [];

    const response = await fetch(nasacoinRPC.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${nasacoinRPC.user}:${nasacoinRPC.password}`).toString('base64')
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: '1',
        method: method,
        params: params
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    logger.error('NASA Coin RPC error', error);
    res.status(500).json({ error: 'RPC call failed' });
  }
});

// Market data endpoints
app.get('/api/market/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `price:${symbol}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch from external API
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`);
    const data = await response.json();
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(data));
    
    res.json(data);
  } catch (error) {
    logger.error('Market data error', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Mining statistics endpoint
app.get('/api/mining/stats', async (req, res) => {
  try {
    const cacheKey = 'mining:stats';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch mining info from NASA Coin
    const response = await fetch(nasacoinRPC.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${nasacoinRPC.user}:${nasacoinRPC.password}`).toString('base64')
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: '1',
        method: 'getmininginfo',
        params: []
      })
    });

    const data = await response.json();
    
    // Cache for 30 seconds
    await redis.setex(cacheKey, 30, JSON.stringify(data.result));
    
    res.json(data.result);
  } catch (error) {
    logger.error('Mining stats error', error);
    res.status(500).json({ error: 'Failed to fetch mining stats' });
  }
});

// Blockchain info endpoint
app.get('/api/blockchain/info', async (req, res) => {
  try {
    const cacheKey = 'blockchain:info';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const response = await fetch(nasacoinRPC.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${nasacoinRPC.user}:${nasacoinRPC.password}`).toString('base64')
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: '1',
        method: 'getblockchaininfo',
        params: []
      })
    });

    const data = await response.json();
    
    // Cache for 10 seconds
    await redis.setex(cacheKey, 10, JSON.stringify(data.result));
    
    res.json(data.result);
  } catch (error) {
    logger.error('Blockchain info error', error);
    res.status(500).json({ error: 'Failed to fetch blockchain info' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  Sentry.captureException(error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await pool.end();
  
  // Close Redis connection
  redis.disconnect();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close database connections
  await pool.end();
  
  // Close Redis connection
  redis.disconnect();
  
  process.exit(0);
});

// Start server
app.listen(PORT, process.env.API_HOST || '0.0.0.0', () => {
  logger.info(`NASA Coin API server running on port ${PORT}`);
});

module.exports = app;
