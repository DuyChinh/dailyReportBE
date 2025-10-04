const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Report content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Report date is required'],
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report author is required']
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false // Optional - report can be standalone or linked to task
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'project', 'other'],
    default: 'daily'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
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
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ author: 1, date: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ date: -1 });
reportSchema.index({ tags: 1 });

// Virtual for formatted date
reportSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update approvedAt when status changes to approved
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
