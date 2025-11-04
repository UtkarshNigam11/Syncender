const CricketMatch = require('../models/CricketMatch');
const cricketApiService = require('./cricketApiService');
const cricketFilters = require('../config/cricketFilters');

/**
 * Cricket Match Cache Service
 * Optimizes API usage by caching matches in database
 * Strategy: Fetch all at midnight, refresh only live matches during day
 * Now includes smart filtering to show only major tournaments
 */

/**
 * Sync all cricket matches from API to database
 * Called by cron job at midnight
 * Now filters out minor tournaments automatically
 */
exports.syncAllMatches = async () => {
  try {
    console.log('🏏 Starting daily cricket matches sync...');
    
    // Fetch from API
    const apiResponse = await cricketApiService.getCricketMatches();
    
    if (!apiResponse.success || !apiResponse.matches) {
      console.error('❌ Failed to fetch matches from API');
      return { success: false, message: 'API fetch failed' };
    }

    const matches = apiResponse.matches;
    console.log(`📥 Fetched ${matches.length} matches from API`);

    let updated = 0;
    let created = 0;
    let filtered = 0;
    let errors = 0;

    // Upsert each match (with filtering)
    for (const match of matches) {
      try {
        // FILTER: Check if match should be shown
        const shouldShow = cricketFilters.shouldShowMatch(match);
        
        if (!shouldShow) {
          filtered++;
          console.log(`🚫 Filtered out: ${match.name} (minor tournament)`);
          continue; // Skip this match
        }

        const matchData = {
          matchId: match.id,
          name: match.name,
          matchType: match.matchType || 'other',
          teams: match.teams || [],
          teamInfo: match.teamInfo || [],
          venue: match.venue || 'TBD',
          date: match.date,
          dateTimeGMT: new Date(match.dateTimeGMT || match.date),
          status: match.status || 'Scheduled',
          matchStarted: match.matchStarted || false,
          matchEnded: match.matchEnded || false,
          seriesId: match.series_id || match.seriesId,
          score: match.score || [],
          fantasyEnabled: match.fantasyEnabled || false,
          bbbEnabled: match.bbbEnabled || false,
          hasSquad: match.hasSquad || false,
          lastFetched: new Date(),
          fetchedFrom: 'matches',
          // Mark as needing refresh if live or starts within 24 hours
          shouldRefresh: match.matchStarted && !match.matchEnded || 
                        (new Date(match.dateTimeGMT) - new Date() < 24 * 60 * 60 * 1000)
        };

        const result = await CricketMatch.findOneAndUpdate(
          { matchId: match.id },
          matchData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error(`Error upserting match ${match.id}:`, err.message);
        errors++;
      }
    }

    console.log(`✅ Sync complete: ${created} created, ${updated} updated, ${filtered} filtered, ${errors} errors`);
    console.log(`📊 API calls used: ${apiResponse.apiInfo?.hitsUsed || 'N/A'}/${apiResponse.apiInfo?.hitsLimit || 100}`);

    return {
      success: true,
      stats: { created, updated, filtered, errors, total: matches.length }
    };
  } catch (error) {
    console.error('❌ Error in syncAllMatches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Refresh only live matches (for real-time updates during the day)
 * Uses minimal API calls
 */
exports.refreshLiveMatches = async () => {
  try {
    console.log('🔄 Refreshing live matches...');
    
    // Get matches marked as needing refresh from DB
    const matchesToRefresh = await CricketMatch.find({ shouldRefresh: true });
    
    if (matchesToRefresh.length === 0) {
      console.log('✅ No live matches to refresh');
      return { success: true, refreshed: 0 };
    }

    // Fetch current matches from API (only live/recent)
    const apiResponse = await cricketApiService.getCricketMatches();
    
    if (!apiResponse.success) {
      return { success: false, message: 'API fetch failed' };
    }

    const apiMatches = apiResponse.matches || [];
    let refreshed = 0;

    // Update only the matches we have in DB
    for (const dbMatch of matchesToRefresh) {
      const apiMatch = apiMatches.find(m => m.id === dbMatch.matchId);
      
      if (apiMatch) {
        dbMatch.status = apiMatch.status;
        dbMatch.matchStarted = apiMatch.matchStarted;
        dbMatch.matchEnded = apiMatch.matchEnded;
        dbMatch.score = apiMatch.score || [];
        dbMatch.lastFetched = new Date();
        
        // Stop refreshing if match ended
        if (apiMatch.matchEnded) {
          dbMatch.shouldRefresh = false;
        }
        
        await dbMatch.save();
        refreshed++;
      }
    }

    console.log(`✅ Refreshed ${refreshed} live matches`);
    return { success: true, refreshed };
  } catch (error) {
    console.error('❌ Error refreshing live matches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get matches that are currently happening or starting soon
 * This determines if we should refresh
 */
exports.getActiveMatchWindow = async () => {
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Find matches that are:
    // 1. Currently live (started but not ended)
    // 2. Starting within next 2 hours
    // 3. Started within last 2 hours (might still be ongoing)
    const activeMatches = await CricketMatch.find({
      $or: [
        // Currently live
        { matchStarted: true, matchEnded: false },
        // Starting soon
        { 
          dateTimeGMT: { $gte: now, $lte: twoHoursFromNow },
          matchStarted: false 
        },
        // Recently started (might be live)
        { 
          dateTimeGMT: { $gte: twoHoursAgo, $lte: now },
          matchEnded: false 
        }
      ]
    }).sort({ dateTimeGMT: 1 });

    return {
      hasActiveMatches: activeMatches.length > 0,
      matches: activeMatches,
      count: activeMatches.length
    };
  } catch (error) {
    console.error('Error checking active match window:', error);
    return { hasActiveMatches: false, matches: [], count: 0 };
  }
};

/**
 * Smart refresh - only refreshes if matches are actually happening
 */
exports.smartRefresh = async () => {
  try {
    // Check if there are any active matches worth refreshing
    const activeWindow = await this.getActiveMatchWindow();
    
    if (!activeWindow.hasActiveMatches) {
      console.log('⏸️  No active matches - skipping refresh');
      return { success: true, skipped: true, reason: 'No active matches' };
    }

    console.log(`🎯 ${activeWindow.count} active matches - proceeding with refresh`);
    return await this.refreshLiveMatches();
  } catch (error) {
    console.error('Error in smart refresh:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old matches (delete matches older than specified days)
 */
exports.cleanupOldMatches = async (daysToKeep = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    console.log(`🧹 Cleaning up matches older than ${daysToKeep} days...`);
    
    const result = await CricketMatch.deleteMany({
      dateTimeGMT: { $lt: cutoffDate },
      matchEnded: true
    });

    console.log(`✅ Deleted ${result.deletedCount} old matches`);
    return {
      success: true,
      deleted: result.deletedCount,
      cutoffDate: cutoffDate.toISOString()
    };
  } catch (error) {
    console.error('❌ Error cleaning up old matches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get matches from database (no API call)
 * This is what frontend will use
 */
exports.getMatchesFromCache = async (options = {}) => {
  try {
    console.log('📦 Getting matches from CACHE (no API call)');
    
    const {
      daysAhead = 7,
      daysBack = 2,
      includeCompleted = true,
      includeLive = true,
      includeUpcoming = true
    } = options;

    const now = new Date();
    const results = {
      live: [],
      upcoming: [],
      recent: []
    };

    // Get live matches
    if (includeLive) {
      results.live = await CricketMatch.getLiveMatches();
    }

    // Get upcoming matches
    if (includeUpcoming) {
      results.upcoming = await CricketMatch.getUpcomingMatches(daysAhead);
    }

    // Get recent completed matches
    if (includeCompleted) {
      results.recent = await CricketMatch.getRecentMatches(daysBack);
    }

    // Remove score data from each array separately (as requested by user)
    const removeScores = (matches) => matches.map(match => {
      const matchObj = match.toObject();
      delete matchObj.score; // Remove live scores
      return matchObj;
    });

    const liveWithoutScores = removeScores(results.live);
    const upcomingWithoutScores = removeScores(results.upcoming);
    const recentWithoutScores = removeScores(results.recent);

    return {
      success: true,
      live: liveWithoutScores,
      upcoming: upcomingWithoutScores,
      recent: recentWithoutScores,
      stats: {
        live: liveWithoutScores.length,
        upcoming: upcomingWithoutScores.length,
        recent: recentWithoutScores.length,
        total: liveWithoutScores.length + upcomingWithoutScores.length + recentWithoutScores.length
      },
      source: 'database_cache',
      lastUpdated: results.live[0]?.lastFetched || results.upcoming[0]?.lastFetched || new Date()
    };
  } catch (error) {
    console.error('Error getting matches from cache:', error);
    throw error;
  }
};

/**
 * Check if cache needs refresh
 */
exports.needsRefresh = async () => {
  try {
    // Check if we have any data
    const count = await CricketMatch.countDocuments();
    
    if (count === 0) {
      return { needs: true, reason: 'No cached data' };
    }

    // Check if data is stale (more than 24 hours old)
    const latestMatch = await CricketMatch.findOne().sort({ lastFetched: -1 });
    const hoursSinceUpdate = (new Date() - latestMatch.lastFetched) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      return { needs: true, reason: 'Data older than 24 hours' };
    }

    return { needs: false };
  } catch (error) {
    return { needs: true, reason: 'Error checking cache', error: error.message };
  }
};

/**
 * Manual sync trigger (for admin/testing)
 */
exports.forceSyncNow = async () => {
  console.log('🔧 Manual sync triggered');
  return await this.syncAllMatches();
};

/**
 * Clean up old completed matches from database
 * Removes matches older than specified days
 */
exports.cleanupOldMatches = async (daysToKeep = 7) => {
  try {
    console.log(`🧹 Cleaning up matches older than ${daysToKeep} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Delete completed matches older than cutoff date
    const result = await CricketMatch.deleteMany({
      matchEnded: true,
      dateTimeGMT: { $lt: cutoffDate }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} old matches`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate
    };
  } catch (error) {
    console.error('❌ Error cleaning up old matches:', error);
    return { success: false, error: error.message, deletedCount: 0 };
  }
};

/**
 * Get cache statistics
 */
exports.getCacheStats = async () => {
  try {
    const total = await CricketMatch.countDocuments();
    const live = await CricketMatch.countDocuments({ 
      matchStarted: true, 
      matchEnded: false 
    });
    const upcoming = await CricketMatch.countDocuments({
      matchStarted: false,
      matchEnded: false,
      dateTimeGMT: { $gte: new Date() }
    });
    const completed = await CricketMatch.countDocuments({
      matchEnded: true
    });
    const needsRefresh = await CricketMatch.countDocuments({
      shouldRefresh: true
    });
    
    // Get oldest and newest match dates
    const oldestMatch = await CricketMatch.findOne()
      .sort({ dateTimeGMT: 1 })
      .select('dateTimeGMT name');
    
    const newestMatch = await CricketMatch.findOne()
      .sort({ dateTimeGMT: -1 })
      .select('dateTimeGMT name');
    
    // Get last fetch time
    const lastFetched = await CricketMatch.findOne()
      .sort({ lastFetched: -1 })
      .select('lastFetched');
    
    return {
      total,
      live,
      upcoming,
      completed,
      needsRefresh,
      oldestMatch: oldestMatch ? {
        date: oldestMatch.dateTimeGMT,
        name: oldestMatch.name
      } : null,
      newestMatch: newestMatch ? {
        date: newestMatch.dateTimeGMT,
        name: newestMatch.name
      } : null,
      lastFetched: lastFetched?.lastFetched
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};
