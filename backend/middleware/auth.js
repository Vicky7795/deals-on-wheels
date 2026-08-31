const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token and attach user object to req
const authenticateUser = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authorization token missing.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'deals_on_wheels_super_secret_jwt_key_2026');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. User account not found.'
      });
    }

    // Account Status Checks
    if (user.accountStatus === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the platform administrator.'
      });
    }

    if (user.accountStatus === 'suspended') {
      // Suspend blocks mutation requests (POST, PUT, DELETE, PATCH)
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. You cannot perform write operations.'
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

// Middleware to restrict access to Buyers only (or unified Users)
const requireBuyer = (req, res, next) => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'buyer')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This feature is reserved for users.'
    });
  }
  next();
};

// Middleware to restrict access to Sellers only (or unified Users)
const requireSeller = (req, res, next) => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'seller')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This feature is reserved for users.'
    });
  }
  next();
};

// Middleware to restrict access to unified Users only
const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This feature is reserved for users only.'
    });
  }
  next();
};

// Middleware to restrict access to Admins only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This feature is reserved for administrators only.'
    });
  }
  next();
};

// Middleware to restrict access to Buyers, Sellers or unified Users
const requireBuyerOrSeller = (req, res, next) => {
  if (!req.user || !['buyer', 'seller', 'user'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This feature is reserved for users.'
    });
  }
  next();
};

module.exports = {
  authenticateUser,
  requireBuyer,
  requireSeller,
  requireUser,
  requireAdmin,
  requireBuyerOrSeller
};
