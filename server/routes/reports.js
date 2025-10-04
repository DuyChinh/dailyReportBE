const express = require('express');
const { body, query } = require('express-validator');
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  addComment,
  getUserReports
} = require('../controllers/reportController');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const Report = require('../models/Report');

const router = express.Router();

// Validation rules
const createReportValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 2000 }),
  body('category')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'project', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 }),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('task')
    .optional()
    .isMongoId()
    .withMessage('Task must be a valid MongoDB ObjectId')
];

const updateReportValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 }),
  body('category')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'project', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('task')
    .optional()
    .isMongoId()
    .withMessage('Task must be a valid MongoDB ObjectId')
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected'])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'project', 'other'])
    .withMessage('Invalid category filter'),
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'status', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// @route   GET /api/reports
// @desc    Get all reports with filtering and pagination
// @access  Private
router.get('/', protect, queryValidation, getReports);

// @route   GET /api/reports/user/:userId
// @desc    Get reports by specific user
// @access  Private
router.get('/user/:userId', protect, queryValidation, getUserReports);

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private
router.get('/:id', protect, getReport);

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', protect, createReportValidation, createReport);

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', protect, checkOwnership(Report), updateReportValidation, updateReport);

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', protect, checkOwnership(Report), deleteReport);

// @route   POST /api/reports/:id/comments
// @desc    Add comment to report
// @access  Private
router.post('/:id/comments', protect, commentValidation, addComment);

module.exports = router;
