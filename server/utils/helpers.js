const crypto = require('crypto');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure token
 * @param {number} length - Length of the token
 * @returns {string} Secure token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Sanitize input string to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
const validatePasswordStrength = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong'
  };
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'time')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return null;
  
  const d = new Date(date);
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Calculate pagination info
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination info
 */
const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null
  };
};

/**
 * Create success response object
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {object} meta - Additional metadata
 * @returns {object} Success response
 */
const createSuccessResponse = (message, data = null, meta = {}) => {
  const response = {
    success: true,
    message,
    ...meta
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Create error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} errors - Additional error details
 * @returns {object} Error response
 */
const createErrorResponse = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Generate a slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} Slug
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
const truncateText = (text, length = 100, suffix = '...') => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

module.exports = {
  generateRandomString,
  generateSecureToken,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  formatDate,
  calculatePagination,
  createSuccessResponse,
  createErrorResponse,
  deepClone,
  isEmpty,
  generateSlug,
  truncateText
};
