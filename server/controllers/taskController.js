const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks (Admin) or assigned tasks (User)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
      assignedBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // If user is not admin, only show tasks assigned to them
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user.id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo && req.user.role === 'admin') filter.assignedTo = assignedTo;
    if (assignedBy && req.user.role === 'admin') filter.assignedBy = assignedBy;

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get tasks with pagination
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      count: tasks.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can access this task
    if (req.user.role !== 'admin' && 
        task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task'
    });
  }
};

// @desc    Create new task (Admin only)
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
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

    const taskData = {
      ...req.body,
      assignedBy: req.user.id
    };

    const task = await Task.create(taskData);

    // Populate assigned user information
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
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

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can update this task
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Don't allow non-admin to change certain fields
    const updateData = { ...req.body };
    if (req.user.role !== 'admin') {
      delete updateData.assignedTo;
      delete updateData.assignedBy;
      delete updateData.priority;
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email').populate('assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
};

// @desc    Delete task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Soft delete - set isActive to false
    task.isActive = false;
    await task.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
};

// @desc    Search tasks for user (for report creation)
// @route   GET /api/tasks/search
// @access  Private
const searchTasks = async (req, res) => {
  try {
    const { q, status = 'pending,in_progress', limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const filter = {
      isActive: true,
      assignedTo: req.user.id,
      status: { $in: status.split(',') }
    };

    // Text search
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];

    const tasks = await Task.find(filter)
      .select('title description status priority dueDate category')
      .sort({ dueDate: 1, priority: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching tasks'
    });
  }
};

// @desc    Get user's tasks for dropdown (simplified)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    // If no status specified, include all statuses by default
    const { status , limit = 50 } = req.query;

    const filter = {
      isActive: true,
      assignedTo: req.user.id,
      // status: { $in: status.split(',') }
    };

    const tasks = await Task.find(filter)
      .select('title status priority dueDate category')
      .sort({ dueDate: 1, priority: -1 })
      .limit(parseInt(limit));

    console.log(tasks);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting my tasks'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can comment on this task
    if (req.user.role !== 'admin' && 
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this task'
      });
    }

    const comment = {
      user: req.user.id,
      content
    };

    task.comments.push(comment);
    await task.save();

    // Populate the new comment
    await task.populate('comments.user', 'name email');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: task.comments[task.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const filter = { isActive: true };
    
    // If user is not admin, only show their tasks
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user.id;
    }

    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueCount = await Task.countDocuments({
      ...filter,
      status: { $nin: ['completed', 'cancelled'] },
      dueDate: { $lt: new Date() }
    });

    res.json({
      success: true,
      data: {
        statusStats: stats,
        priorityStats: priorityStats,
        overdueCount
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task statistics'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  getMyTasks,
  addComment,
  getTaskStats
};
