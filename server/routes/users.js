const express = require('express');
const { body, query } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role filter'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search term must be between 1 and 50 characters')
];

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), queryValidation, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updateUserValidation, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

module.exports = router;
