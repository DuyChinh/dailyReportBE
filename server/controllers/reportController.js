const { validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // If user is not admin, only show their reports or public reports
    if (req.user.role !== 'admin') {
      filter.$or = [
        { author: req.user.id },
        { isPublic: true }
      ];
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (author && req.user.role === 'admin') filter.author = author;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reports with pagination
    const reports = await Report.find(filter)
      .populate('author', 'name email')
      .populate('approvedBy', 'name email')
      .populate('task', 'title status priority dueDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      count: reports.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting reports'
    });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('author', 'name email')
      .populate('approvedBy', 'name email')
      .populate('task', 'title description status priority dueDate category')
      .populate('comments.user', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can access this report
    if (req.user.role !== 'admin' && 
        report.author._id.toString() !== req.user.id && 
        !report.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting report'
    });
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const reportData = {
      ...req.body,
      author: req.user.id
    };

    // If task is provided, validate it exists and is assigned to user
    if (req.body.task) {
      const task = await Task.findById(req.body.task);
      if (!task) {
        return res.status(400).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      // Check if task is assigned to the current user
      if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Task is not assigned to you'
        });
      }
    }

    const report = await Report.create(reportData);

    // Populate author information
    await report.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating report'
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can update this report
    if (req.user.role !== 'admin' && report.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Don't allow updating certain fields if not admin
    const updateData = { ...req.body };
    if (req.user.role !== 'admin') {
      delete updateData.status;
      delete updateData.approvedBy;
      delete updateData.approvedAt;
    }

    report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating report'
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can delete this report
    if (req.user.role !== 'admin' && report.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting report'
    });
  }
};

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can comment on this report
    if (req.user.role !== 'admin' && 
        report.author.toString() !== req.user.id && 
        !report.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this report'
      });
    }

    const comment = {
      user: req.user.id,
      content
    };

    report.comments.push(comment);
    await report.save();

    // Populate the new comment
    await report.populate('comments.user', 'name email');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: report.comments[report.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
};

// @desc    Get user reports
// @route   GET /api/reports/user/:userId
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, category } = req.query;

    // Check if user can access other user's reports
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these reports'
      });
    }

    const filter = { author: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
      .populate('author', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      count: reports.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: reports
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user reports'
    });
  }
};

module.exports = {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  addComment,
  getUserReports
};
