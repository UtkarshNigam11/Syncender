const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cronService = require('./services/cronService');
const cricketScheduler = require('./services/cricketScheduler');
const eventCleanupService = require('./services/eventCleanupService');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers

// Configure CORS to allow only the frontend origin
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Debug middleware - log only important requests (not notifications polling)
app.use((req, res, next) => {
  if (!req.path.includes('/notifications/unread-count') && !req.path.includes('/api/sports/scores')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-calendar';
console.log('🔌 Attempting to connect to MongoDB...');
console.log('📍 Connection string:', mongoUri.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(mongoUri, {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/sports', require('./routes/sportsRoutes'));
app.use('/api/apple', require('./routes/appleRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/favourites', require('./routes/favouritesRoutes')); // User favourites management
app.use('/api/notifications', require('./routes/notificationRoutes')); // User notifications

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize cron jobs after server starts
  cronService.initializeCronJobs();
  
  // Initialize cricket match sync scheduler
  cricketScheduler.initializeScheduler();
  
  // Initialize event cleanup service
  eventCleanupService.startAutomaticCleanup();
});