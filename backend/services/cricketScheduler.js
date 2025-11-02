const cron = require('node-cron');
const cricketCacheService = require('./cricketCacheService');

/**
 * Cricket Match Sync Scheduler
 * Optimizes API usage with strategic scheduling
 */

let isInitialized = false;

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
  cron.schedule('*/10 * * * *', async () => {
    await cricketCacheService.smartRefresh();
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
  console.log('✅ Scheduler initialized successfully');
  console.log('📅 Daily sync: 00:00 IST (full match list)');
  console.log('🎯 Smart refresh: Every 10 min (only if matches active)');
  console.log('🧹 Daily cleanup: 01:00 IST (7-day old matches)');
  console.log('🧹 Weekly cleanup: Sunday 02:00 IST (30-day old matches)');
  console.log('📊 Estimated API usage: 10-40 calls/day (60-90 buffer)');
};

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
