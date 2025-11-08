const Notification = require('../models/Notification');
const User = require('../models/User');
const CricketMatch = require('../models/CricketMatch');

/**
 * Create a notification for a user
 */
async function createNotification(userId, notificationData) {
  try {
    // Check if user has notifications enabled
    const user = await User.findById(userId).select('preferences.notifications');
    
    if (!user || !user.preferences.notifications.inApp) {
      return null;
    }
    
    // Check if this type of notification is enabled
    const notifType = notificationData.type;
    if (notifType === 'match_reminder' && !user.preferences.notifications.matchReminders) return null;
    if (notifType === 'match_starting' && !user.preferences.notifications.matchStarting) return null;
    if (notifType === 'match_live' && !user.preferences.notifications.matchLive) return null;
    if (notifType === 'match_result' && !user.preferences.notifications.matchResults) return null;
    if (notifType === 'team_news' && !user.preferences.notifications.teamAlerts) return null;
    if (notifType === 'league_update' && !user.preferences.notifications.leagueUpdates) return null;
    if (notifType === 'calendar_sync_success' && !user.preferences.notifications.calendarSync) return null;
    if (notifType === 'calendar_sync_failed' && !user.preferences.notifications.calendarSync) return null;
    if (notifType === 'subscription_expiring' && !user.preferences.notifications.subscriptionAlerts) return null;
    if (notifType === 'system_announcement' && !user.preferences.notifications.systemAnnouncements) return null;
    
    // Check quiet hours
    if (user.preferences.notifications.quietHoursEnabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const start = user.preferences.notifications.quietHoursStart;
      const end = user.preferences.notifications.quietHoursEnd;
      
      // Check if current time is within quiet hours
      if (isWithinQuietHours(currentTime, start, end)) {
        console.log(`⏰ Quiet hours active for user ${userId}, skipping notification`);
        return null;
      }
    }
    
    const notification = new Notification({
      userId,
      ...notificationData,
      sent: true,
      sentAt: new Date()
    });
    
    await notification.save();
    console.log(`✅ Created notification for user ${userId}: ${notificationData.title}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(currentTime, startTime, endTime) {
  // Handle case where quiet hours span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Send match reminder notifications (30 min before match)
 * Called by cron job
 */
async function sendMatchReminders() {
  try {
    console.log('📧 Checking for upcoming matches to send reminders...');
    
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000); // 35 minutes window
    
    // Get all users with their favourite teams
    const users = await User.find({
      'preferences.favoriteTeams.0': { $exists: true },
      'preferences.notifications.matchReminders': true,
      'preferences.notifications.inApp': true
    }).select('_id preferences.favoriteTeams preferences.notifications');
    
    console.log(`👥 Found ${users.length} users with favourite teams`);
    
    let notificationsSent = 0;
    
    for (const user of users) {
      const favouriteTeams = user.preferences.favoriteTeams || [];
      
      // Get cricket matches for user's favourite teams
      const teamNames = favouriteTeams
        .filter(t => t.sport === 'cricket')
        .map(t => t.name);
      
      if (teamNames.length > 0) {
        const upcomingMatches = await CricketMatch.find({
          dateTimeGMT: { $gte: reminderWindow, $lte: windowEnd },
          matchStarted: false,
          $or: [
            { 'teams.0': { $in: teamNames } },
            { 'teams.1': { $in: teamNames } }
          ]
        });
        
        for (const match of upcomingMatches) {
          // Check if notification already sent for this match
          const existingNotif = await Notification.findOne({
            userId: user._id,
            type: 'match_reminder',
            matchId: match.matchId
          });
          
          if (!existingNotif) {
            await createNotification(user._id, {
              type: 'match_reminder',
              category: 'match',
              priority: 'high',
              title: '🏏 Match Starting Soon!',
              message: `${match.teams[0]} vs ${match.teams[1]} starts in 30 minutes`,
              matchId: match.matchId,
              sport: 'cricket',
              actionUrl: '/matches',
              actionText: 'View Match',
              metadata: {
                matchType: match.matchType,
                venue: match.venue,
                startTime: match.dateTimeGMT
              }
            });
            notificationsSent++;
          }
        }
      }
    }
    
    console.log(`✅ Sent ${notificationsSent} match reminder notifications`);
    return { success: true, count: notificationsSent };
  } catch (error) {
    console.error('Error sending match reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send live match notifications
 * Called when a match goes live
 */
async function sendLiveMatchNotifications(match) {
  try {
    console.log(`🎯 Sending live match notifications for: ${match.teams[0]} vs ${match.teams[1]}`);
    
    // Find users who have either team as favourite
    const users = await User.find({
      'preferences.favoriteTeams': {
        $elemMatch: {
          sport: 'cricket',
          name: { $in: match.teams }
        }
      },
      'preferences.notifications.matchLive': true,
      'preferences.notifications.inApp': true
    }).select('_id');
    
    let notificationsSent = 0;
    
    for (const user of users) {
      // Check if notification already sent
      const existingNotif = await Notification.findOne({
        userId: user._id,
        type: 'match_live',
        matchId: match.matchId
      });
      
      if (!existingNotif) {
        await createNotification(user._id, {
          type: 'match_live',
          category: 'match',
          priority: 'high',
          title: '🔴 LIVE NOW!',
          message: `${match.teams[0]} vs ${match.teams[1]} is now live`,
          matchId: match.matchId,
          sport: 'cricket',
          actionUrl: '/matches',
          actionText: 'Watch Live',
          metadata: {
            matchType: match.matchType,
            venue: match.venue,
            status: match.status
          }
        });
        notificationsSent++;
      }
    }
    
    console.log(`✅ Sent ${notificationsSent} live match notifications`);
    return { success: true, count: notificationsSent };
  } catch (error) {
    console.error('Error sending live match notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send match result notifications
 * Called when a match ends
 */
async function sendMatchResultNotifications(match) {
  try {
    console.log(`🏆 Sending match result notifications for: ${match.teams[0]} vs ${match.teams[1]}`);
    
    // Find users who have either team as favourite
    const users = await User.find({
      'preferences.favoriteTeams': {
        $elemMatch: {
          sport: 'cricket',
          name: { $in: match.teams }
        }
      },
      'preferences.notifications.matchResults': true,
      'preferences.notifications.inApp': true
    }).select('_id');
    
    let notificationsSent = 0;
    
    for (const user of users) {
      // Check if notification already sent
      const existingNotif = await Notification.findOne({
        userId: user._id,
        type: 'match_result',
        matchId: match.matchId
      });
      
      if (!existingNotif) {
        await createNotification(user._id, {
          type: 'match_result',
          category: 'match',
          priority: 'medium',
          title: '🏆 Match Finished!',
          message: `${match.teams[0]} vs ${match.teams[1]} - ${match.status}`,
          matchId: match.matchId,
          sport: 'cricket',
          actionUrl: '/matches',
          actionText: 'View Result',
          metadata: {
            matchType: match.matchType,
            venue: match.venue,
            status: match.status,
            score: match.score
          }
        });
        notificationsSent++;
      }
    }
    
    console.log(`✅ Sent ${notificationsSent} match result notifications`);
    return { success: true, count: notificationsSent };
  } catch (error) {
    console.error('Error sending match result notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send calendar sync notifications
 */
async function sendCalendarSyncNotification(userId, success, details = {}) {
  try {
    const notifData = success ? {
      type: 'calendar_sync_success',
      category: 'calendar',
      priority: 'low',
      title: '✅ Calendar Synced',
      message: `Successfully synced ${details.count || 0} matches to your calendar`,
      actionUrl: '/calendar',
      actionText: 'View Calendar',
      metadata: details
    } : {
      type: 'calendar_sync_failed',
      category: 'calendar',
      priority: 'medium',
      title: '⚠️ Calendar Sync Failed',
      message: details.error || 'Failed to sync calendar. Please reconnect your account.',
      actionUrl: '/settings',
      actionText: 'Fix Now',
      metadata: details
    };
    
    await createNotification(userId, notifData);
  } catch (error) {
    console.error('Error sending calendar sync notification:', error);
  }
}

/**
 * Send subscription expiring notification
 */
async function sendSubscriptionExpiringNotification(userId, daysLeft) {
  try {
    await createNotification(userId, {
      type: 'subscription_expiring',
      category: 'subscription',
      priority: 'high',
      title: '⏰ Pro Plan Expiring Soon',
      message: `Your Pro plan expires in ${daysLeft} days. Renew to keep your benefits!`,
      actionUrl: '/subscription',
      actionText: 'Renew Now',
      metadata: { daysLeft }
    });
  } catch (error) {
    console.error('Error sending subscription expiring notification:', error);
  }
}

/**
 * Send welcome notification to new user
 */
async function sendWelcomeNotification(userId) {
  try {
    await createNotification(userId, {
      type: 'system_announcement',
      category: 'system',
      priority: 'low',
      title: '👋 Welcome to Syncender!',
      message: 'Add your favourite teams and never miss a match. Get live scores and calendar sync!',
      actionUrl: '/favourites',
      actionText: 'Add Teams',
      metadata: { isWelcome: true }
    });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
}

module.exports = {
  createNotification,
  sendMatchReminders,
  sendLiveMatchNotifications,
  sendMatchResultNotifications,
  sendCalendarSyncNotification,
  sendSubscriptionExpiringNotification,
  sendWelcomeNotification
};
