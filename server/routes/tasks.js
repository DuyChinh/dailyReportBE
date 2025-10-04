const express = require('express');
const { body, query } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  getMyTasks,
  addComment,
  getTaskStats
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('assignedTo')
    .isMongoId()
    .withMessage('Valid assigned user ID is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .optional()
    .isIn(['development', 'design', 'testing', 'documentation', 'meeting', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .optional()
    .isIn(['development', 'design', 'testing', 'documentation', 'meeting', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('actualHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual hours must be a positive number')
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
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  query('category')
    .optional()
    .isIn(['development', 'design', 'testing', 'documentation', 'meeting', 'other'])
    .withMessage('Invalid category filter'),
  query('sortBy')
    .optional()
    .isIn(['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// @route   GET /api/tasks
// @desc    Get all tasks (Admin) or assigned tasks (User)
// @access  Private
router.get('/', protect, queryValidation, getTasks);

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', protect, getTaskStats);

// @route   GET /api/tasks/search
// @desc    Search tasks for user (for report creation)
// @access  Private
router.get('/search', protect, searchTasks);

// @route   GET /api/tasks/my-tasks
// @desc    Get user's tasks for dropdown (simplified)
// @access  Private
router.get('/my-tasks', protect, getMyTasks);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, getTask);

// @route   POST /api/tasks
// @desc    Create new task (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), createTaskValidation, createTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, updateTaskValidation, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', protect, commentValidation, addComment);

module.exports = router;
