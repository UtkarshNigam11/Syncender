const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * Send custom notification to specific users
 */
exports.sendCustomNotification = async (req, res) => {
  try {
    const { 
      userIds, // Array of user IDs, or 'all' for all users
      title, 
      message, 
      priority = 'medium',
      category = 'system',
      actionUrl,
      actionText,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    let targetUsers = [];
    
    // Determine target users
    if (userIds === 'all') {
      targetUsers = await User.find({ isActive: true }).select('_id');
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid userIds. Provide an array of user IDs or "all"'
      });
    }
    
    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active users found'
      });
    }
    
    // Create notifications for all target users
    const notificationPromises = targetUsers.map(user =>
      notificationService.createNotification(user._id, {
        type: 'custom',
        category,
        priority,
        title,
        message,
        actionUrl,
        actionText,
        metadata: {
          ...metadata,
          sentBy: req.user.email,
          sentAt: new Date()
        }
      })
    );
    
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    res.json({
      success: true,
      message: `Notification sent to ${successCount} users`,
      details: {
        targeted: targetUsers.length,
        sent: successCount,
        failed: targetUsers.length - successCount
      }
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * Send announcement to all Pro users
 */
exports.sendProAnnouncement = async (req, res) => {
  try {
    const { title, message, actionUrl, actionText } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    const proUsers = await User.find({ 
      plan: 'pro', 
      planStatus: 'active',
      isActive: true 
    }).select('_id');
    
    if (proUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active Pro users found'
      });
    }
    
    const notificationPromises = proUsers.map(user =>
      notificationService.createNotification(user._id, {
        type: 'system_announcement',
        category: 'system',
        priority: 'medium',
        title: `🌟 ${title}`,
        message,
        actionUrl,
        actionText,
        metadata: {
          targetAudience: 'pro',
          sentBy: req.user.email
        }
      })
    );
    
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    res.json({
      success: true,
      message: `Announcement sent to ${successCount} Pro users`,
      details: {
        targeted: proUsers.length,
        sent: successCount
      }
    });
  } catch (error) {
    console.error('Error sending Pro announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

/**
 * Send match alert to users following specific teams
 */
exports.sendTeamMatchAlert = async (req, res) => {
  try {
    const { 
      sport, 
      teamName, 
      title, 
      message, 
      matchId,
      actionUrl = '/matches'
    } = req.body;
    
    if (!sport || !teamName || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'sport, teamName, title, and message are required'
      });
    }
    
    // Find users following this team
    const users = await User.find({
      'preferences.favoriteTeams': {
        $elemMatch: {
          sport,
          name: teamName
        }
      },
      isActive: true
    }).select('_id');
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No users following ${teamName} in ${sport}`
      });
    }
    
    const notificationPromises = users.map(user =>
      notificationService.createNotification(user._id, {
        type: 'team_news',
        category: 'team',
        priority: 'high',
        title,
        message,
        matchId,
        sport,
        teamId: teamName,
        actionUrl,
        actionText: 'View Details',
        metadata: {
          teamName,
          sentBy: req.user.email
        }
      })
    );
    
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    res.json({
      success: true,
      message: `Alert sent to ${successCount} users following ${teamName}`,
      details: {
        targeted: users.length,
        sent: successCount
      }
    });
  } catch (error) {
    console.error('Error sending team match alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alert',
      error: error.message
    });
  }
};

/**
 * Get notification statistics
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [
      totalSent,
      totalRead,
      byType,
      byCategory,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments({ createdAt: { $gte: cutoffDate } }),
      Notification.countDocuments({ createdAt: { $gte: cutoffDate }, read: true }),
      Notification.aggregate([
        { $match: { createdAt: { $gte: cutoffDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: cutoffDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.find({ createdAt: { $gte: cutoffDate } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('type category title createdAt read')
        .lean()
    ]);
    
    const readRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      stats: {
        period: `Last ${days} days`,
        total: totalSent,
        read: totalRead,
        unread: totalSent - totalRead,
        readRate: `${readRate}%`,
        byType,
        byCategory,
        recentNotifications
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
};

/**
 * Test notification (send to admin only)
 */
exports.testNotification = async (req, res) => {
  try {
    const { title = 'Test Notification', message = 'This is a test notification from admin panel' } = req.body;
    
    await notificationService.createNotification(req.user.id, {
      type: 'system_announcement',
      category: 'system',
      priority: 'low',
      title,
      message,
      metadata: { isTest: true }
    });
    
    res.json({
      success: true,
      message: 'Test notification sent to your account'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
};

module.exports = {
  sendCustomNotification: exports.sendCustomNotification,
  sendProAnnouncement: exports.sendProAnnouncement,
  sendTeamMatchAlert: exports.sendTeamMatchAlert,
  getNotificationStats: exports.getNotificationStats,
  testNotification: exports.testNotification
};
