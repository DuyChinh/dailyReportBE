const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned by a user']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['development', 'design', 'testing', 'documentation', 'meeting', 'other'],
    default: 'other'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative']
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' }); // Text search index

// Virtual for formatted due date
taskSchema.virtual('formattedDueDate').get(function() {
  return this.dueDate.toISOString().split('T')[0];
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && this.dueDate < new Date();
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update completedDate when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
