# Syncender

A professional MERN stack application for sports calendar integration that allows users to track sports events and seamlessly sync them with Google Calendar and Apple Calendar.

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based auth with Google OAuth
- 🏆 **Sports Event Management** - Create, read, update, delete sports events
- 📅 **Google Calendar Integration** - Two-way sync with Google Calendar
- 🍎 **Apple Calendar Support** - Generate and download ICS files
- 👥 **Team & Match Tracking** - Follow your favorite teams and matches
- 🔒 **Protected Routes** - Secure API endpoints with middleware protection
- 🎯 **Professional Architecture** - Clean, maintainable code structure

## 🚀 Tech Stack

- **Frontend**: React 18, Material-UI, Vite
- **Backend**: Node.js, Express.js, MongoDB
- **Authentication**: JWT, Google OAuth 2.0
- **Database**: MongoDB with Mongoose
- **APIs**: Google Calendar API, Sports APIs
- **Development**: Nodemon, ESLint, Error Handling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Google Cloud Platform account (for Google Calendar API)
- npm or yarn package manager

## 🛠️ Getting Started

### Backend Setup

1. **Clone the repository:**
```bash
git clone https://github.com/UtkarshNigam11/Syncender.git
cd sports-calendar-integration
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Environment Configuration:**
Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sports-calendar

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=24h

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

4. **Start the backend server:**
```bash
npm run dev  # Development with nodemon
# or
npm start    # Production
```

### Frontend Setup

1. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

2. **Start the frontend development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and backend at `http://localhost:5000`.

## 📚 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### 📅 Events
- `GET /api/events` - Get all events for authenticated user
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get a specific event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event
- `POST /api/events/:eventId/google` - Add event to Google Calendar

### 🏆 Sports
- `GET /api/sports/sports` - Get available sports
- `GET /api/sports/matches/:sportId` - Get matches for a sport
- `GET /api/sports/teams/:sportId` - Get teams for a sport
- `GET /api/sports/matches/:sportId/:matchId` - Get match details

### 🍎 Apple Calendar
- `POST /api/apple/calendar` - Generate and download ICS file

## 🏗️ Project Structure

```
sports-calendar-integration/
├── backend/
│   ├── controllers/          # Business logic
│   │   ├── eventController.js
│   │   ├── appleController.js
│   │   └── authController.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/              # Database schemas
│   │   ├── Event.js
│   │   └── User.js
│   ├── routes/              # API routes
│   │   ├── eventRoutes.js
│   │   ├── authRoutes.js
│   │   ├── sportsRoutes.js
│   │   └── appleRoutes.js
│   ├── services/            # External service integrations
│   │   └── googleCalendarService.js
│   ├── utils/               # Utility functions
│   │   └── icalHelper.js
│   ├── config/              # Configuration files
│   │   └── google.js
│   ├── server.js            # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 📊 Development Status

### ✅ Backend (Completed)
- [x] **Server Setup** - Express.js with middleware
- [x] **Database Models** - User and Event schemas
- [x] **Authentication System** - JWT + Google OAuth
- [x] **Event Management** - Full CRUD operations
- [x] **Route Protection** - Secure middleware
- [x] **Google Calendar Integration** - Two-way sync
- [x] **Apple Calendar Support** - ICS file generation
- [x] **Error Handling** - Centralized error middleware
- [x] **Input Validation** - Express-validator integration
- [x] **Clean Architecture** - Controller-service pattern

### 🚧 Frontend (In Progress)
- [x] **Project Setup** - React + Vite + Material-UI
- [x] **Authentication Context** - User state management
- [x] **Protected Routes** - Route protection component
- [x] **Basic Pages** - Login, Register, Dashboard, etc.
- [ ] **Event Management UI** - Create/edit events interface
- [ ] **Calendar Integration UI** - Google/Apple calendar connect
- [ ] **Sports Data Display** - Teams, matches, standings
- [ ] **Responsive Design** - Mobile-friendly interface

### 🧪 Testing & Deployment
- [ ] **Unit Tests** - Backend controller tests
- [ ] **Integration Tests** - API endpoint tests
- [ ] **Frontend Tests** - Component testing
- [ ] **E2E Tests** - User flow testing
- [ ] **Docker Setup** - Containerization
- [ ] **CI/CD Pipeline** - Automated deployment

## 🔧 Key Features Implemented

### Backend Architecture
- **Controller-Based Routing**: Clean separation of concerns
- **Service Layer**: Centralized business logic for external APIs
- **Middleware Stack**: Authentication, validation, error handling
- **Database Integration**: MongoDB with Mongoose ODM

### Calendar Integration
- **Google Calendar**: OAuth 2.0 authentication and event sync
- **Apple Calendar**: ICS file generation for seamless import
- **Event Management**: Create, update, delete across platforms

### Security & Validation
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error management
- **Route Protection**: Middleware-based access control

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```
3. **Make your changes and commit:**
```bash
git commit -m "feat: add your feature description"
```
4. **Push to your branch:**
```bash
git push origin feature/your-feature-name
```
5. **Create a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Use semantic commit messages

## 🔐 Environment Variables

**Security Note**: Never commit the `.env` file to version control.

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables on your hosting platform
3. Deploy to platforms like Heroku, Vercel, or DigitalOcean

### Frontend Deployment
1. Build the frontend: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or AWS S3

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Utkarsh Nigam**
- GitHub: [@UtkarshNigam11](https://github.com/UtkarshNigam11)
- Project: [Syncender](https://github.com/UtkarshNigam11/Syncender)

## 🙏 Acknowledgments

- Google Calendar API for seamless calendar integration
- Material-UI for beautiful React components
- MongoDB for reliable data storage
- Express.js for robust backend framework 