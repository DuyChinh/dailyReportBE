const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns the resource or is admin
const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.author && resource.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in ownership check'
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  checkOwnership
};
