const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { errorHandler, notFound } = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
// app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Daily Report System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/current': 'Get current user',
        'PUT /api/auth/profile': 'Update user profile',
        'PUT /api/auth/password': 'Change password'
      },
      reports: {
        'GET /api/reports': 'Get all reports (with filtering & pagination)',
        'GET /api/reports/:id': 'Get specific report',
        'POST /api/reports': 'Create new report',
        'PUT /api/reports/:id': 'Update report',
        'DELETE /api/reports/:id': 'Delete report',
        'POST /api/reports/:id/comments': 'Add comment to report',
        'GET /api/reports/user/:userId': 'Get reports by user'
      },
      users: {
        'GET /api/users': 'Get all users (Admin only)',
        'GET /api/users/:id': 'Get user by ID (Admin only)',
        'PUT /api/users/:id': 'Update user (Admin only)',
        'DELETE /api/users/:id': 'Delete user (Admin only)'
      },
      tasks: {
        'GET /api/tasks': 'Get all tasks (Admin) or assigned tasks (User)',
        'GET /api/tasks/:id': 'Get single task',
        'POST /api/tasks': 'Create new task (Admin only)',
        'PUT /api/tasks/:id': 'Update task',
        'DELETE /api/tasks/:id': 'Delete task (Admin only)',
        'GET /api/tasks/search': 'Search tasks for user (for report creation)',
        'GET /api/tasks/my-tasks': 'Get user tasks for dropdown',
        'GET /api/tasks/stats': 'Get task statistics',
        'POST /api/tasks/:id/comments': 'Add comment to task'
      }
    },
    documentation: 'https://github.com/your-repo/dailyreport-backend'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
