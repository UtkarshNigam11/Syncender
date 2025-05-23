const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  sport: {
    type: String,
    required: [true, 'Sport type is required'],
    trim: true
  },
  teams: {
    home: {
      type: String,
      required: [true, 'Home team is required']
    },
    away: {
      type: String,
      required: [true, 'Away team is required']
    }
  },
  venue: {
    name: String,
    location: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  source: {
    type: String,
    enum: ['api', 'manual', 'google', 'apple'],
    required: true
  },
  externalIds: {
    googleCalendar: String,
    appleCalendar: String,
    sportsApi: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema); 