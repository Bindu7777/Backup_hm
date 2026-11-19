const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const emailRoutes = require('./routes/email');
const likedVendorsRoutes = require('./routes/likedVendors');
const contactedVendorsRoutes = require('./routes/contactedVendors');
const couponsRoutes = require('./routes/coupons');
const adminNotificationsRoutes = require('./routes/adminNotifications');
const momoRoutes = require('./routes/momo');
const chatNotifyRoutes = require('./routes/chatNotify');
const { initializeEmailService } = require('./services/emailService');

const logger = require('./utils/logger');
const { errorFields } = require('./utils/logger');
const { supabaseConfigured } = require('./config/supabase');

const httpLog = logger('http');
const serverLog = logger('server');

const app = express();
// Behind Vercel's proxy: use the real client IP for rate limiting.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// One log line per request: method, path, status, time taken and Vercel's request id.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const data = {
      status: res.statusCode,
      ms: Date.now() - start,
      requestId: req.headers['x-vercel-id'] || null,
    };
    const message = `${req.method} ${req.originalUrl}`;
    if (res.statusCode >= 500) httpLog.error('request', message, data);
    else if (res.statusCode >= 400) httpLog.warn('request', message, data);
    else httpLog.info('request', message, data);
  });
  next();
});

// Security middleware
// Basic helmet is applied above or specifically configured

// Rate limiting to prevent spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many email requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

// Re-configure helmet to be more permissive for cross-origin resources in development
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for easier development
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to email routes
app.use('/api/email', limiter);

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/liked-vendors', likedVendorsRoutes);
app.use('/api/contacted-vendors', contactedVendorsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/admin-notifications', adminNotificationsRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/chat', chatNotifyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Event Vendor Email API',
    supabase: supabaseConfigured ? 'configured' : 'missing settings'
  });
});

// Initialize email service
initializeEmailService();

// Error handling middleware
app.use((err, req, res, next) => {
  serverLog.error('errorHandler', err.message, { method: req.method, path: req.originalUrl, error: errorFields(err) });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Email API Server running on port ${PORT}`);
    console.log(`📧 Email service initialized`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
}

// Errors that escape every handler: logged so they show up in Vercel's logs.
process.on('unhandledRejection', (reason) => {
  serverLog.error('unhandledRejection', String(reason && reason.message ? reason.message : reason), { error: errorFields(reason) });
});

module.exports = app;
