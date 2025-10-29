const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Subscription/plan information
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  planStatus: {
    type: String,
    enum: ['active', 'canceled', 'expired'],
    default: 'active',
  },
  planStartedAt: Date,
  planExpiresAt: Date,

  googleCalendarToken: {
    accessToken: String,
    refreshToken: String,
    expiryDate: Date
  },
  appleCalendarToken: {
    accessToken: String,
    refreshToken: String,
    expiryDate: Date
  },
  // Favorite teams for auto-sync
  favoriteTeams: [{
    sport: String,
    league: String,
    teamId: String,
    name: String,
  }],
  preferences: {
    favoriteTeams: { type: [String], default: [] },
    favoriteSports: { type: [String], default: [] },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      matchReminders: { type: Boolean, default: true },
      reminderMinutes: { type: Number, default: 30 },
      teamAlerts: { type: Boolean, default: true },
      newsUpdates: { type: Boolean, default: false },
      emailAlerts: { type: Boolean, default: false },
    },
    appearance: {
      darkMode: { type: Boolean, default: false }, // legacy toggle
      themeMode: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
      accentColor: { type: String, default: 'blue' },
      density: { type: String, enum: ['comfortable', 'compact'], default: 'comfortable' },
    },
    behavior: {
      defaultLanding: { type: String, enum: ['live', 'upcoming', 'my-teams'], default: 'live' },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);