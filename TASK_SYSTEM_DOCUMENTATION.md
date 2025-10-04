# Task Management System - Frontend Documentation

## 📋 Tổng quan hệ thống

Hệ thống Task Management cho phép:
- **Admin** tạo và assign task cho user
- **User** xem task được giao và tạo report liên kết với task
- **Search task** theo title khi tạo report
- **Theo dõi tiến độ** và quản lý task

## 🚀 API Endpoints

### 1. Task Management APIs

#### **GET /api/tasks** - Lấy danh sách tasks
**Quyền truy cập:** Private
- **Admin:** Xem tất cả tasks
- **User:** Chỉ xem tasks được assign

**Query Parameters:**
```javascript
{
  page: 1,                    // Số trang
  limit: 10,                  // Số items/trang
  status: "pending",          // pending, in_progress, completed, cancelled
  priority: "high",           // low, medium, high, urgent
  category: "development",    // development, design, testing, documentation, meeting, other
  assignedTo: "userId",       // ID user được assign (Admin only)
  assignedBy: "adminId",      // ID admin tạo task (Admin only)
  search: "keyword",          // Tìm kiếm theo title, description, tags
  sortBy: "createdAt",        // title, status, priority, dueDate, createdAt, updatedAt
  sortOrder: "desc"           // asc, desc
}
```

**Response:**
```javascript
{
  "success": true,
  "count": 5,
  "total": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "data": [
    {
      "_id": "taskId",
      "title": "Implement user authentication",
      "description": "Create login and registration system",
      "assignedTo": {
        "_id": "userId",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assignedBy": {
        "_id": "adminId",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "status": "pending",
      "priority": "high",
      "category": "development",
      "dueDate": "2025-10-10T00:00:00.000Z",
      "startDate": "2025-10-04T00:00:00.000Z",
      "tags": ["frontend", "auth"],
      "estimatedHours": 8,
      "actualHours": null,
      "isOverdue": false,
      "daysUntilDue": 6,
      "createdAt": "2025-10-04T13:10:56.338Z",
      "updatedAt": "2025-10-04T13:10:56.338Z"
    }
  ]
}
```

#### **POST /api/tasks** - Tạo task mới (Admin only)
**Quyền truy cập:** Private/Admin

**Request Body:**
```javascript
{
  "title": "Implement user authentication",
  "description": "Create login and registration system with JWT",
  "assignedTo": "userId",              // Required - ID của user được assign
  "priority": "high",                  // low, medium, high, urgent
  "category": "development",           // development, design, testing, documentation, meeting, other
  "status": "pending",                 // pending, in_progress, completed, cancelled
  "dueDate": "2025-10-10T00:00:00.000Z", // Required
  "startDate": "2025-10-04T00:00:00.000Z", // Optional
  "tags": ["frontend", "auth", "jwt"],
  "estimatedHours": 8
}
```

#### **GET /api/tasks/search** - Tìm kiếm tasks cho user
**Quyền truy cập:** Private
**Mục đích:** Sử dụng khi tạo report để chọn task

**Query Parameters:**
```javascript
{
  q: "authentication",        // Required - từ khóa tìm kiếm (min 2 ký tự)
  status: "pending,in_progress", // Optional - trạng thái tasks
  limit: 20                   // Optional - số lượng kết quả
}
```

**Response:**
```javascript
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "taskId",
      "title": "Implement user authentication",
      "description": "Create login and registration system",
      "status": "pending",
      "priority": "high",
      "dueDate": "2025-10-10T00:00:00.000Z",
      "category": "development"
    }
  ]
}
```

#### **GET /api/tasks/my-tasks** - Lấy tasks của user (simplified)
**Quyền truy cập:** Private
**Mục đích:** Dropdown cho user chọn task khi tạo report

**Query Parameters:**
```javascript
{
  status: "pending,in_progress", // Optional
  limit: 50                      // Optional
}
```

### 2. Report APIs (Updated)

#### **POST /api/reports** - Tạo report mới
**Quyền truy cập:** Private

**Request Body:**
```javascript
{
  "title": "Daily Report - Authentication Implementation", // Optional nếu có task
  "content": "Completed user login functionality...",
  "category": "daily",
  "task": "taskId",              // Optional - ID của task liên kết
  "tags": ["progress", "auth"],
  "isPublic": false
}
```

**Lưu ý:** Nếu có `task`, title sẽ được tự động lấy từ task title nếu không cung cấp.

## 🎨 Frontend Implementation Guide

### 1. Admin Dashboard - Task Management

#### **Tạo Task Form:**
```javascript
const CreateTaskForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    category: 'other',
    dueDate: '',
    tags: [],
    estimatedHours: null
  });

  const [users, setUsers] = useState([]);

  // Lấy danh sách users để assign
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Task Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
      />
      
      <select
        value={formData.assignedTo}
        onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
        required
      >
        <option value="">Select User</option>
        {users.map(user => (
          <option key={user._id} value={user._id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      
      <select
        value={formData.priority}
        onChange={(e) => setFormData({...formData, priority: e.target.value})}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      
      <input
        type="datetime-local"
        value={formData.dueDate}
        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
        required
      />
      
      <button type="submit">Create Task</button>
    </form>
  );
};
```

#### **Task List Component:**
```javascript
const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  const fetchTasks = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setTasks(data.data);
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Task Cards */}
      <div className="task-grid">
        {tasks.map(task => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
};
```

### 2. User Dashboard - My Tasks & Reports

#### **Task Search Component (for Report Creation):**
```javascript
const TaskSearch = ({ onTaskSelect, selectedTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchTasks = async (query) => {
    if (query.length < 2) return;
    
    const response = await fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setTasks(data.data);
  };

  const handleSearch = debounce(searchTasks, 300);

  return (
    <div className="task-search">
      <input
        type="text"
        placeholder="Search tasks by title..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && (
        <div className="search-results">
          {tasks.map(task => (
            <div
              key={task._id}
              className={`task-option ${selectedTask?._id === task._id ? 'selected' : ''}`}
              onClick={() => {
                onTaskSelect(task);
                setSearchTerm(task.title);
                setIsOpen(false);
              }}
            >
              <div className="task-title">{task.title}</div>
              <div className="task-meta">
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <span className="due-date">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### **Create Report Form (with Task Selection):**
```javascript
const CreateReportForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'daily',
    task: null,
    tags: []
  });

  const handleTaskSelect = (task) => {
    setFormData({
      ...formData,
      task: task,
      title: task.title // Auto-fill title from task
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        task: formData.task?._id
      })
    });
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <TaskSearch
        onTaskSelect={handleTaskSelect}
        selectedTask={formData.task}
      />
      
      <input
        type="text"
        placeholder="Report Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Report Content"
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        required
      />
      
      <button type="submit">Create Report</button>
    </form>
  );
};
```

### 3. Task Status Management

#### **Update Task Status:**
```javascript
const updateTaskStatus = async (taskId, newStatus) => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: newStatus })
  });
  
  if (response.ok) {
    // Refresh task list
    fetchTasks();
  }
};
```

## 🎯 Key Features Implementation

### 1. **Task Assignment Flow:**
1. Admin tạo task và assign cho user
2. User nhận notification (có thể implement thêm)
3. User xem task trong dashboard
4. User tạo report liên kết với task

### 2. **Report Creation with Task:**
1. User search task theo title
2. Chọn task từ dropdown
3. Title tự động fill từ task
4. Tạo report với task reference

### 3. **Task Tracking:**
1. User update status task
2. Admin theo dõi progress
3. Thống kê completion rate

## 🔧 Utility Functions

```javascript
// Debounce function for search
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format date for display
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Get priority color
const getPriorityColor = (priority) => {
  const colors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    urgent: '#dc3545'
  };
  return colors[priority] || '#6c757d';
};
```

## 📱 Mobile Considerations

- **Touch-friendly** task cards
- **Swipe gestures** để update status
- **Responsive** search dropdown
- **Quick actions** cho mobile

## 🚀 Next Steps

1. Implement real-time notifications
2. Add task templates
3. Create task dependencies
4. Add time tracking
5. Generate task reports

---

**Lưu ý:** Tất cả API calls cần include JWT token trong Authorization header.
