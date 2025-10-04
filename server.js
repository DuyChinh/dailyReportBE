const app = require('./server/app');
const connectDB = require('./server/config/db');
const config = require('./server/config/config');

// Connect to database
connectDB();

// For Vercel serverless
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Start server for local development
  const PORT = config.port || 3000;

  const server = app.listen(PORT, () => {
    console.log(`
🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
📡 Server listening on port ${PORT}
🌐 API available at http://localhost:${PORT}/api
📚 API documentation at http://localhost:${PORT}/api
❤️  Health check at http://localhost:${PORT}/health
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err.message);
    // Close server & exit process
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  module.exports = server;
}
