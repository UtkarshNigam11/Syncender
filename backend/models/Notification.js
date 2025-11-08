const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'match_reminder',      // 30 min before match
      'match_starting',      // Match is about to start
      'match_live',          // Match just went live
      'match_result',        // Match finished with result
      'team_news',           // News about favourite team
      'league_update',       // League standings/news
      'calendar_sync_success', // Calendar synced successfully
      'calendar_sync_failed',  // Calendar sync failed
      'subscription_expiring', // Pro plan expiring soon
      'subscription_upgraded', // Upgraded to Pro
      'system_announcement',   // Admin announcements
      'custom'               // Custom admin notification
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Related entities
  matchId: {
    type: String,
    index: true
  },
  teamId: String,
  leagueId: String,
  sport: String,
  
  // Notification metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['match', 'team', 'league', 'system', 'subscription', 'calendar'],
    default: 'system'
  },
  
  // Action link (optional)
  actionUrl: String,
  actionText: String,
  
  // Status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  
  // Delivery status
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: Date,
  
  // For scheduled notifications
  scheduledFor: Date,
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    // Auto-delete notifications after 30 days
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return await this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
