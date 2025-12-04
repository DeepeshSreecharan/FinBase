// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const amountRoutes = require('./routes/amount.routes');
const fdRoutes = require('./routes/fd.routes');
const atmRoutes = require('./routes/atm.routes');
const transactionRoutes = require('./routes/transactions.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * Robust CORS configuration
 *
 * - Supports comma-separated CLIENT_URL env var
 * - Allows common local dev origins
 * - Allows vercel preview subdomains (hostname endsWith .vercel.app)
 * - Allows requests with no Origin (curl, Postman, server-to-server)
 * - Explicitly handles preflight OPTIONS
 */
const clientList = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const devOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
];

const allowedOrigins = Array.from(new Set([...clientList, ...devOrigins]));

function isOriginAllowed(origin) {
  if (!origin) return true; // allow requests with no origin (curl, Postman, server-to-server)
  // exact match
  if (allowedOrigins.includes(origin)) return true;

  try {
    const u = new URL(origin);
    const hostname = u.hostname.toLowerCase();

    // Allow vercel preview domains like <anything>.vercel.app
    if (hostname.endsWith('.vercel.app')) return true;

    // Allow localhost hostnames (covers different ports)
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch (err) {
    // invalid origin format -> disallow
    return false;
  }

  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    // TEMP DEBUG: uncomment to log incoming origins during troubleshooting
    // console.log('[CORS] incoming origin:', origin);

    // Quick allow in local development (optional)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false, // let cors module handle preflight response
};

// Apply CORS globally and enable preflight for all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicit preflight handler

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // More restrictive for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    type: 'application/json',
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'CBI Bank API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/amount', amountRoutes);
app.use('/api/fd', fdRoutes);
app.use('/api/atm', atmRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/contact', contactRoutes);

// 404 handler for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
