const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  }
});

module.exports = { apiRateLimiter };
