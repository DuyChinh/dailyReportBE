# Daily Report System - Backend API

A robust Node.js backend API for a Daily Report System built with Express.js, MongoDB, and JWT authentication.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Report Management**: Create, read, update, and delete daily reports
- **Role-based Access**: User and Admin roles with different permissions
- **Advanced Filtering**: Search, filter, and paginate reports
- **Comments System**: Add comments to reports
- **Security**: Rate limiting, CORS, input validation, and sanitization
- **Error Handling**: Comprehensive error handling and logging

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js              # Database connection
│   └── config.js          # Environment configuration
├── controllers/
│   ├── authController.js   # Authentication logic
│   └── reportController.js # Report management logic
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── error.js           # Error handling middleware
├── models/
│   ├── User.js            # User model
│   └── Report.js          # Report model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── reports.js         # Report routes
│   └── users.js           # User management routes (Admin)
├── utils/
│   └── helpers.js         # Utility functions
├── app.js                 # Express app configuration
└── server.js              # Server entry point
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dailyreportBE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dailyreport
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   BCRYPT_ROUNDS=12
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/current` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Reports
- `GET /api/reports` - Get all reports (with filtering & pagination)
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/comments` - Add comment to report
- `GET /api/reports/user/:userId` - Get reports by user

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Query Parameters

### Reports Filtering
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (draft, submitted, approved, rejected)
- `category` - Filter by category (daily, weekly, monthly, project, other)
- `author` - Filter by author ID (Admin only)
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)
- `search` - Search in title, content, and tags
- `sortBy` - Sort field (date, title, status, createdAt)
- `sortOrder` - Sort order (asc, desc)

### Users Filtering (Admin)
- `page` - Page number
- `limit` - Items per page
- `role` - Filter by role (user, admin)
- `isActive` - Filter by active status
- `search` - Search in name and email

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Sanitization**: XSS protection

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/dailyreport` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `BCRYPT_ROUNDS` | bcrypt salt rounds | `12` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🚀 Deployment

1. **Production Environment**
   ```bash
   NODE_ENV=production npm start
   ```

2. **Docker Deployment**
   ```bash
   docker build -t dailyreport-backend .
   docker run -p 5000:5000 dailyreport-backend
   ```

3. **Environment Variables**
   Set all required environment variables in your production environment.

## 📈 Monitoring

- Health check endpoint: `GET /health`
- API documentation: `GET /api`
- Logging with Morgan in development and production modes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.
