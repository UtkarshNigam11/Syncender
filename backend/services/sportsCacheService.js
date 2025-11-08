const sportsApiService = require('./sportsApiService');

/**
 * Unified Sports Cache Service
 * Implements tiered caching with different TTLs based on data volatility
 * 
 * CACHE STRATEGY:
 * - Live matches: 10 seconds (scores change frequently)
 * - Upcoming matches: 60 seconds (schedules rarely change)
 * - Full data: Uses the shortest TTL to ensure live data freshness
 */

// Separate caches for live and upcoming data
const liveCache = {
  nfl: { data: null, timestamp: null },
  nba: { data: null, timestamp: null },
  epl: { data: null, timestamp: null },
  ucl: { data: null, timestamp: null }
};

const upcomingCache = {
  nfl: { data: null, timestamp: null },
  nba: { data: null, timestamp: null },
  epl: { data: null, timestamp: null },
  ucl: { data: null, timestamp: null }
};

// Tiered TTLs based on data volatility
const LIVE_TTL = 30 * 1000;          // 30 seconds - live scores update frequently
const UPCOMING_TTL = 2 * 60 * 1000;  // 2 minutes - schedules are stable

/**
 * Clear live match caches only (for refresh button)
 */
exports.clearLiveCache = () => {
  console.log('🔄 Clearing live matches cache only');
  liveCache.nfl = { data: null, timestamp: null };
  liveCache.nba = { data: null, timestamp: null };
  liveCache.epl = { data: null, timestamp: null };
  liveCache.ucl = { data: null, timestamp: null };
};

/**
 * Get NFL data with tiered caching
 */
exports.getNFLData = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Check if we need fresh data
  const liveCacheValid = !forceRefresh && liveCache.nfl.data && liveCache.nfl.timestamp && (now - liveCache.nfl.timestamp) < LIVE_TTL;
  const upcomingCacheValid = !forceRefresh && upcomingCache.nfl.data && upcomingCache.nfl.timestamp && (now - upcomingCache.nfl.timestamp) < UPCOMING_TTL;
  
  if (liveCacheValid && upcomingCacheValid) {
    console.log('📦 NFL: Using cached data (live + upcoming)');
    return {
      ...liveCache.nfl.data,
      cachedLive: true,
      cachedUpcoming: true
    };
  }

  console.log(`🔄 NFL: Fetching fresh data from API ${!liveCacheValid ? '(live expired)' : ''} ${!upcomingCacheValid ? '(upcoming expired)' : ''}`);
  const data = await sportsApiService.getLiveScores('nfl');
  
  // Store in both caches
  liveCache.nfl.data = data;
  liveCache.nfl.timestamp = now;
  upcomingCache.nfl.data = data;
  upcomingCache.nfl.timestamp = now;
  
  return data;
};

/**
 * Get NBA data with tiered caching
 */
exports.getNBAData = async (forceRefresh = false) => {
  const now = Date.now();
  
  const liveCacheValid = !forceRefresh && liveCache.nba.data && liveCache.nba.timestamp && (now - liveCache.nba.timestamp) < LIVE_TTL;
  const upcomingCacheValid = !forceRefresh && upcomingCache.nba.data && upcomingCache.nba.timestamp && (now - upcomingCache.nba.timestamp) < UPCOMING_TTL;
  
  if (liveCacheValid && upcomingCacheValid) {
    console.log('📦 NBA: Using cached data (live + upcoming)');
    return {
      ...liveCache.nba.data,
      cachedLive: true,
      cachedUpcoming: true
    };
  }

  console.log(`🔄 NBA: Fetching fresh data from API ${!liveCacheValid ? '(live expired)' : ''} ${!upcomingCacheValid ? '(upcoming expired)' : ''}`);
  const data = await sportsApiService.getLiveScores('nba');
  
  liveCache.nba.data = data;
  liveCache.nba.timestamp = now;
  upcomingCache.nba.data = data;
  upcomingCache.nba.timestamp = now;
  
  return data;
};

/**
 * Get English Premier League data with tiered caching
 */
exports.getEPLData = async (forceRefresh = false) => {
  const now = Date.now();
  
  const liveCacheValid = !forceRefresh && liveCache.epl.data && liveCache.epl.timestamp && (now - liveCache.epl.timestamp) < LIVE_TTL;
  const upcomingCacheValid = !forceRefresh && upcomingCache.epl.data && upcomingCache.epl.timestamp && (now - upcomingCache.epl.timestamp) < UPCOMING_TTL;
  
  if (liveCacheValid && upcomingCacheValid) {
    console.log('📦 EPL: Using cached data (live + upcoming)');
    return {
      ...liveCache.epl.data,
      cachedLive: true,
      cachedUpcoming: true
    };
  }

  console.log(`🔄 EPL: Fetching fresh data from API ${!liveCacheValid ? '(live expired)' : ''} ${!upcomingCacheValid ? '(upcoming expired)' : ''}`);
  const data = await sportsApiService.getSoccerLeagueScores('eng.1');
  
  liveCache.epl.data = data;
  liveCache.epl.timestamp = now;
  upcomingCache.epl.data = data;
  upcomingCache.epl.timestamp = now;
  
  return data;
};

/**
 * Get UEFA Champions League data with tiered caching
 */
exports.getUCLData = async (forceRefresh = false) => {
  const now = Date.now();
  
  const liveCacheValid = !forceRefresh && liveCache.ucl.data && liveCache.ucl.timestamp && (now - liveCache.ucl.timestamp) < LIVE_TTL;
  const upcomingCacheValid = !forceRefresh && upcomingCache.ucl.data && upcomingCache.ucl.timestamp && (now - upcomingCache.ucl.timestamp) < UPCOMING_TTL;
  
  if (liveCacheValid && upcomingCacheValid) {
    console.log('📦 UCL: Using cached data (live + upcoming)');
    return {
      ...liveCache.ucl.data,
      cachedLive: true,
      cachedUpcoming: true
    };
  }

  console.log(`🔄 UCL: Fetching fresh data from API ${!liveCacheValid ? '(live expired)' : ''} ${!upcomingCacheValid ? '(upcoming expired)' : ''}`);
  const data = await sportsApiService.getSoccerLeagueScores('uefa.champions');
  
  liveCache.ucl.data = data;
  liveCache.ucl.timestamp = now;
  upcomingCache.ucl.data = data;
  upcomingCache.ucl.timestamp = now;
  
  return data;
};

/**
 * Clear all caches (for full refresh - not used by refresh button)
 */
exports.clearCache = () => {
  console.log('🗑️  Clearing ALL sports cache');
  Object.keys(liveCache).forEach(key => {
    liveCache[key] = { data: null, timestamp: null };
  });
  Object.keys(upcomingCache).forEach(key => {
    upcomingCache[key] = { data: null, timestamp: null };
  });
};

/**
 * Get cache statistics
 */
exports.getCacheStats = () => {
  const now = Date.now();
  const stats = {};
  
  ['nfl', 'nba', 'epl', 'ucl'].forEach(sport => {
    stats[sport] = {
      live: {
        cached: !!liveCache[sport].data,
        age: liveCache[sport].timestamp ? now - liveCache[sport].timestamp : null,
        ttl: LIVE_TTL,
        valid: liveCache[sport].timestamp ? (now - liveCache[sport].timestamp) < LIVE_TTL : false
      },
      upcoming: {
        cached: !!upcomingCache[sport].data,
        age: upcomingCache[sport].timestamp ? now - upcomingCache[sport].timestamp : null,
        ttl: UPCOMING_TTL,
        valid: upcomingCache[sport].timestamp ? (now - upcomingCache[sport].timestamp) < UPCOMING_TTL : false
      }
    };
  });
  
  return stats;
};
