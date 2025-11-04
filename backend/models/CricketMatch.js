const mongoose = require('mongoose');

const cricketMatchSchema = new mongoose.Schema({
  // CricAPI Match ID
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic match info
  name: {
    type: String,
    required: true
  },
  
  matchType: {
    type: String,
    enum: ['t20', 'odi', 'test', 'other'],
    required: true
  },
  
  // Teams
  teams: [{
    type: String,
    required: true
  }],
  
  teamInfo: [{
    name: String,
    shortname: String,
    img: String
  }],
  
  // Venue and timing
  venue: {
    type: String,
    required: true
  },
  
  date: {
    type: String,
    required: true
  },
  
  dateTimeGMT: {
    type: Date,
    required: true,
    index: true
  },
  
  // Match status
  status: {
    type: String,
    required: true
  },
  
  matchStarted: {
    type: Boolean,
    default: false
  },
  
  matchEnded: {
    type: Boolean,
    default: false
  },
  
  // Series info
  seriesId: {
    type: String,
    index: true
  },
  
  // Score (only stored, not displayed in UI)
  score: [{
    r: Number,      // runs
    w: Number,      // wickets
    o: Number,      // overs
    inning: String
  }],
  
  // Additional flags
  fantasyEnabled: Boolean,
  bbbEnabled: Boolean,
  hasSquad: Boolean,
  
  // Cache metadata
  lastFetched: {
    type: Date,
    default: Date.now
  },
  
  fetchedFrom: {
    type: String,
    enum: ['currentMatches', 'matches', 'manual'],
    default: 'currentMatches'
  },
  
  // For optimization
  shouldRefresh: {
    type: Boolean,
    default: false // Only true for live/upcoming matches
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
cricketMatchSchema.index({ dateTimeGMT: 1, matchEnded: 1 });
cricketMatchSchema.index({ matchStarted: 1, matchEnded: 1 });
cricketMatchSchema.index({ shouldRefresh: 1 });

// Static method to get today's and upcoming matches
cricketMatchSchema.statics.getUpcomingMatches = function(daysAhead = 7) {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return this.find({
    dateTimeGMT: { $gte: now, $lte: future },
    matchStarted: false, // Exclude live matches
    matchEnded: false
  })
  .sort({ dateTimeGMT: 1 })
  .limit(50);
};

// Static method to get live matches
cricketMatchSchema.statics.getLiveMatches = function() {
  return this.find({
    matchStarted: true,
    matchEnded: false
  })
  .sort({ dateTimeGMT: -1 });
};

// Static method to get recent completed matches
cricketMatchSchema.statics.getRecentMatches = function(daysBack = 2) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  return this.find({
    dateTimeGMT: { $gte: past, $lte: now },
    matchEnded: true
  })
  .sort({ dateTimeGMT: -1 })
  .limit(20);
};

module.exports = mongoose.model('CricketMatch', cricketMatchSchema);
