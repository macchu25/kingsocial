const rateLimit = require('express-rate-limit');

// Check if in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter - Disabled in development
const apiLimiter = isDevelopment 
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skip: (req) => {
        // Skip rate limiting for health check endpoint
        return req.path === '/' || req.path === '/health';
      }
    });

// Strict rate limiter for auth endpoints (login, register, password reset) - Disabled in development
const authLimiter = isDevelopment
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: {
        success: false,
        message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
    });

// Rate limiter for password reset (more strict) - Disabled in development
const passwordResetLimiter = isDevelopment
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // Limit each IP to 3 requests per hour
      message: {
        success: false,
        message: 'Quá nhiều lần yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Rate limiter for search endpoints - Disabled in development
const searchLimiter = isDevelopment
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 20, // Limit each IP to 20 requests per minute
      message: {
        success: false,
        message: 'Quá nhiều requests tìm kiếm, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Rate limiter for ChatGPT endpoints (expensive operations) - Disabled in development
const chatGPTLimiter = isDevelopment
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // Limit each IP to 10 requests per minute
      message: {
        success: false,
        message: 'Quá nhiều requests ChatGPT, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  searchLimiter,
  chatGPTLimiter
};


