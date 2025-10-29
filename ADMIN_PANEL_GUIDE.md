# Admin Panel - Complete Setup Guide

## 🎯 Overview
A complete admin panel has been created for Syncender with full user management, analytics, and system monitoring capabilities.

## 🔐 Admin Login Credentials

```
Email:    admin@syncender.com
Password: Admin@123
```

**Admin Panel URL:** `http://localhost:3000/admin`

⚠️ **IMPORTANT:** Change the password after first login!

## 📋 Admin Panel Features

### 1. Dashboard (`/admin/dashboard`)
- **Overview Stats:**
  - Total Users (Active/Inactive breakdown)
  - Pro Subscribers vs Free Users
  - Total Events (Auto-synced vs Manual)
  - Monthly Revenue
  - New Signups Today
  - Users with Calendar Connected
- **Quick Metrics:**
  - User statistics
  - Event statistics
  - Average events per user

### 2. User Management (`/admin/users`)
- **User List:**
  - Paginated table with search
  - Filter by plan (free/pro)
  - Filter by status (active/inactive)
  - View user details
  - Toggle user active/inactive status
  - Delete users
- **User Details:**
  - Full profile information
  - Favorite teams
  - Event count (total and auto-synced)
  - Join date

### 3. Events Management (`/admin/events`)
- **Event List:**
  - Paginated table of all events
  - Filter by sport
  - View event details
  - See which user owns each event
  - Event status (live, scheduled)
  - Event type (auto-synced vs manual)

### 4. System Settings (`/admin/settings`)
- **System Health Monitoring:**
  - Database status
  - Server status
  - Last health check timestamp
- **Environment Configuration:**
  - Environment mode
  - Server port
  - API configuration status
- **API Endpoints:**
  - Base URL reference
  - Admin API reference

## 🛠️ Technical Implementation

### Backend Structure
```
backend/
├── controllers/
│   └── adminController.js         # All admin operations
├── middleware/
│   └── adminAuth.js                # Admin authentication middleware
├── routes/
│   └── adminRoutes.js              # Admin API routes
└── scripts/
    └── createAdmin.js              # Script to create admin users
```

### Frontend Structure
```
frontend/src/
├── pages/admin/
│   ├── AdminLogin.jsx              # Admin login page
│   ├── AdminDashboard.jsx          # Dashboard with stats
│   ├── AdminUsers.jsx              # User management
│   ├── AdminEvents.jsx             # Event management
│   └── AdminSettings.jsx           # System settings
├── components/admin/
│   ├── AdminLayout.jsx             # Admin panel layout with sidebar
│   └── AdminPrivateRoute.jsx      # Protected route component
└── context/
    └── AdminAuthContext.jsx        # Admin authentication context
```

## 🔌 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### Dashboard & Analytics
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/analytics/user-growth?days=30` - User growth data
- `GET /api/admin/analytics/subscription-distribution` - Subscription breakdown
- `GET /api/admin/analytics/popular-sports` - Most popular sports

### User Management
- `GET /api/admin/users?page=1&limit=10&search=&plan=&status=` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Event Management
- `GET /api/admin/events?page=1&limit=20&sport=` - Get all events

### System
- `GET /api/admin/system/health` - System health check

## 🚀 Getting Started

### 1. Create Admin User
```bash
cd backend
node scripts/createAdmin.js
```

### 2. Start Backend Server
```bash
cd backend
npm start
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

### 4. Access Admin Panel
Navigate to: `http://localhost:3000/admin`
Login with the credentials above.

## 🔒 Security Features

1. **JWT Authentication:** All admin routes protected with JWT tokens
2. **Role-Based Access:** Only users with role='admin' can access admin panel
3. **Token Validation:** Tokens expire and require re-authentication
4. **Active Status Check:** Inactive admin accounts are denied access
5. **Password Hashing:** Passwords stored with bcrypt
6. **Protected Routes:** Frontend routes protected with AdminPrivateRoute

## 📊 Stats & Metrics Tracked

### User Metrics
- Total users
- Active/Inactive users
- New signups (today & this month)
- Users with calendar connected
- Users with favorite teams
- Subscription distribution (free vs pro)

### Event Metrics
- Total events
- Auto-synced events
- Manual events
- Recent events (last 7 days)
- Events by sport

### Revenue Metrics
- Monthly recurring revenue (pro users × $9.99)

## 🎨 Admin Panel Design

- **Color Scheme:** Purple gradient primary theme
- **Layout:** Fixed sidebar with responsive design
- **Components:** Material-UI for consistent design
- **Charts:** Ready for integration with recharts
- **Mobile Responsive:** Drawer navigation on mobile devices

## 🔄 Creating Additional Admins

To create another admin user, you can:

1. **Use the script:**
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```
   (Modify the email in the script before running)

2. **Or manually in MongoDB:**
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## 🐛 Troubleshooting

### Admin can't login
- Check if admin user exists in database
- Verify role is set to 'admin'
- Verify isActive is true
- Check JWT_SECRET in .env

### Stats not showing
- Ensure MongoDB connection is working
- Check if backend server is running
- Verify adminToken is stored in localStorage

### Routes not working
- Clear browser cache
- Check console for errors
- Verify all admin files are created correctly

## 📝 Notes

- The admin panel is completely separate from the regular user interface
- Admin accounts can have pro plan features automatically
- All admin actions are logged via MongoDB queries
- The system auto-refreshes health status every 30 seconds
- Pagination is implemented for large datasets

## ✅ Completed Features

- ✅ Admin authentication system
- ✅ Dashboard with key metrics
- ✅ User management (CRUD operations)
- ✅ Event viewing and filtering
- ✅ System health monitoring
- ✅ Responsive admin layout
- ✅ Protected admin routes
- ✅ Search and filter capabilities
- ✅ Pagination for large datasets
- ✅ Role-based access control

## 🔜 Future Enhancements (Optional)

- Email notifications to users
- Bulk user operations
- Advanced analytics charts
- Audit log for admin actions
- Content management for announcements
- API rate limiting dashboard
- Subscription payment integration
- Export data to CSV/Excel
