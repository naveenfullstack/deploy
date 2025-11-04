/**
 * JWT Authentication Middleware
 * Validates JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');
const User = require('../modules/User');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.headers['x-auth-token']; // Alternative header

    if (!token) {
      return res.status(401).json({
        error: 'Access Token Required',
        message: 'Please provide a valid authentication token',
        timestamp: new Date().toISOString()
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token is invalid or user no longer exists',
        timestamp: new Date().toISOString()
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Password was changed recently. Please login again.',
        timestamp: new Date().toISOString()
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    console.error('JWT Authentication Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Authentication token is malformed',
        timestamp: new Date().toISOString()
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      error: 'Authentication Error',
      message: 'Failed to authenticate token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to optionally authenticate JWT tokens
 * Continues even if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.headers['x-auth-token'];

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // If token is provided, validate it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
      req.userId = user._id;
    }

    next();

  } catch (error) {
    // In optional auth, continue even if token validation fails
    console.warn('Optional Auth Warning:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};