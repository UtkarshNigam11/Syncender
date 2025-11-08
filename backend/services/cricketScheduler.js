const cron = require('node-cron');
const cricketCacheService = require('./cricketCacheService');
const notificationService = require('./notificationService');
const CricketMatch = require('../models/CricketMatch');

/**
 * Cricket Match Sync Scheduler
 * Optimizes API usage with strategic scheduling and sends notifications
 */

let isInitialized = false;
let previousMatchStates = new Map(); // Track match states to detect changes

/**
 * Initialize all scheduled jobs
 */
exports.initializeScheduler = () => {
  if (isInitialized) {
    console.log('⏰ Scheduler already initialized');
    return;
  }

  console.log('⏰ Initializing cricket match sync scheduler...');

  // Job 1: Daily full sync at midnight (00:00)
  // This uses 2 API calls (currentMatches + matches)
  cron.schedule('0 0 * * *', async () => {
    console.log('🌙 Midnight sync: Fetching all cricket matches...');
    await cricketCacheService.syncAllMatches();
    
    // Also run cleanup after sync
    console.log('🧹 Running daily cleanup...');
    await cricketCacheService.cleanupOldMatches(7); // Keep only last 7 days
  }, {
    timezone: "Asia/Kolkata" // Indian Standard Time
  });

  // Job 2: Smart refresh - only when matches are actually happening
  // Runs every 10 minutes but only makes API call if matches are active
  // Also checks for match state changes to send notifications
  cron.schedule('*/10 * * * *', async () => {
    await cricketCacheService.smartRefresh();
    await checkMatchStateChanges();
  }, {
    timezone: "Asia/Kolkata"
  });

  // Job 3: Cleanup old matches - runs daily at 1 AM
  // Deletes matches older than 7 days
  cron.schedule('0 1 * * *', async () => {
    console.log('🧹 Daily cleanup: Removing old matches...');
    await cricketCacheService.cleanupOldMatches(7);
  }, {
    timezone: "Asia/Kolkata"
  });

  // Job 4: Weekly deep cleanup - runs every Sunday at 2 AM
  // More aggressive cleanup for very old data
  cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Weekly deep cleanup: Removing ancient matches...');
    await cricketCacheService.cleanupOldMatches(30);
  }, {
    timezone: "Asia/Kolkata"
  });

  // Initial sync on startup (only if cache is empty or stale)
  (async () => {
    const check = await cricketCacheService.needsRefresh();
    if (check.needs) {
      console.log(`🚀 Initial sync needed: ${check.reason}`);
      await cricketCacheService.syncAllMatches();
    } else {
      console.log('✅ Cache is fresh, skipping initial sync');
    }
  })();

  isInitialized = true;
  // Job 5: Match reminders - check every 5 minutes for upcoming matches
  cron.schedule('*/5 * * * *', async () => {
    await notificationService.sendMatchReminders();
  }, {
    timezone: "Asia/Kolkata"
  });

  isInitialized = true;
  console.log('✅ Scheduler initialized successfully');
  console.log('📅 Daily sync: 00:00 IST (full match list)');
  console.log('🎯 Smart refresh: Every 10 min (only if matches active)');
  console.log('🔔 Match reminders: Every 5 min (30 min before matches)');
  console.log('🧹 Daily cleanup: 01:00 IST (7-day old matches)');
  console.log('🧹 Weekly cleanup: Sunday 02:00 IST (30-day old matches)');
  console.log('📊 Estimated API usage: 10-40 calls/day (60-90 buffer)');
};

/**
 * Check for match state changes and send notifications
 */
async function checkMatchStateChanges() {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Get all matches that might be active or changing state
    const matches = await CricketMatch.find({
      dateTimeGMT: { $gte: twoHoursAgo, $lte: twoHoursLater }
    });

    for (const match of matches) {
      const matchId = match.matchId;
      const previousState = previousMatchStates.get(matchId);
      
      const currentState = {
        started: match.matchStarted,
        ended: match.matchEnded,
        status: match.status
      };

      // First time seeing this match
      if (!previousState) {
        previousMatchStates.set(matchId, currentState);
        continue;
      }

      // Check if match just went live
      if (!previousState.started && currentState.started && !currentState.ended) {
        const statusLower = currentState.status?.toLowerCase() || '';
        const isPaused = statusLower.includes('stumps') || 
                        statusLower.includes('tea') || 
                        statusLower.includes('lunch') || 
                        statusLower.includes('rain') ||
                        statusLower.includes('bad light') ||
                        statusLower.includes('delay');
        
        if (!isPaused) {
          console.log(`🔴 Match went LIVE: ${match.teams[0]} vs ${match.teams[1]}`);
          await notificationService.sendLiveMatchNotifications(match);
        }
      }

      // Check if match just ended
      if (!previousState.ended && currentState.ended) {
        console.log(`🏆 Match ENDED: ${match.teams[0]} vs ${match.teams[1]}`);
        await notificationService.sendMatchResultNotifications(match);
      }

      // Update previous state
      previousMatchStates.set(matchId, currentState);
    }

    // Cleanup old entries from map (matches more than 6 hours old)
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    for (const [matchId, state] of previousMatchStates.entries()) {
      // If we haven't seen this match in recent query, remove it
      const matchStillExists = matches.some(m => m.matchId === matchId);
      if (!matchStillExists) {
        previousMatchStates.delete(matchId);
      }
    }
  } catch (error) {
    console.error('Error checking match state changes:', error);
  }
}

/**
 * Get scheduler status
 */
exports.getSchedulerStatus = () => {
  return {
    initialized: isInitialized,
    jobs: {
      dailySync: '00:00 IST daily',
      smartRefresh: 'Every 10 min (only when matches active)',
      dailyCleanup: '01:00 IST daily (7-day retention)',
      weeklyCleanup: 'Sunday 02:00 IST (30-day retention)'
    },
    estimatedDailyApiCalls: '10-40',
    apiLimit: 100,
    features: {
      smartRefresh: 'Only refreshes if matches are happening',
      autoCleanup: 'Automatically deletes old matches',
      matchTiming: 'Checks match timing ±2 hours'
    }
  };
};

/**
 * Stop all scheduled jobs (for testing/shutdown)
 */
exports.stopScheduler = () => {
  if (isInitialized) {
    cron.getTasks().forEach(task => task.stop());
    isInitialized = false;
    console.log('🛑 Scheduler stopped');
  }
};
