const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

exports.generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

exports.votingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.VOTING_RATE_LIMIT) || 5,
  message: 'Too many voting attempts, please try again later',
  handler: (req, res) => {
    throw new ApiError('Too many voting attempts. Please wait before trying again.', 429);
  }
});

exports.registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again later'
});