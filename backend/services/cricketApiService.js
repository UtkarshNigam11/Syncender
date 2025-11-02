const axios = require('axios');

// CricAPI Configuration
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';
const CRICKET_API_KEY = process.env.CRICKET_API_KEY;

/**
 * Get current cricket matches from CricAPI
 * This includes live matches, recent matches, and upcoming scheduled matches
 */
exports.getCricketMatches = async () => {
  try {
    if (!CRICKET_API_KEY) {
      throw new Error('Cricket API key not configured. Please add CRICKET_API_KEY to your .env file');
    }

    // Call real API - try both currentMatches and matches endpoints
    console.log('🏏 Fetching cricket matches from CricAPI...');
    
    // First, get current/live matches
    const currentResponse = await axios.get(`${CRICKET_API_BASE}/currentMatches`, {
      params: {
        apikey: CRICKET_API_KEY,
        offset: 0
      }
    });

    // Then try to get scheduled/upcoming matches
    let allMatches = [];
    let apiInfo = {};
    
    if (currentResponse.data.status === 'success') {
      allMatches = currentResponse.data.data || [];
      apiInfo = currentResponse.data.info || {};
      console.log(`✅ Found ${allMatches.length} current matches`);
    }

    // Try to fetch additional upcoming matches using the matches endpoint
    try {
      const upcomingResponse = await axios.get(`${CRICKET_API_BASE}/matches`, {
        params: {
          apikey: CRICKET_API_KEY,
          offset: 0
        }
      });
      
      if (upcomingResponse.data.status === 'success') {
        const upcomingMatches = upcomingResponse.data.data || [];
        console.log(`✅ Found ${upcomingMatches.length} scheduled/upcoming matches`);
        
        // Merge with existing matches, avoiding duplicates
        const existingIds = new Set(allMatches.map(m => m.id));
        const newMatches = upcomingMatches.filter(m => !existingIds.has(m.id));
        allMatches = [...allMatches, ...newMatches];
        
        // Update API info with the latest
        apiInfo = upcomingResponse.data.info || apiInfo;
      }
    } catch (upcomingError) {
      console.log('⚠️  Could not fetch upcoming matches (might not be available in free tier):', upcomingError.message);
      // Continue with just current matches
    }

    return {
      success: true,
      matches: allMatches,
      sport: 'CRICKET',
      provider: 'CricAPI',
      totalMatches: allMatches.length,
      apiInfo: apiInfo
    };
  } catch (error) {
    console.error('Error fetching cricket matches:', error.message);
    throw error;
  }
};

/**
 * Get cricket match details by ID
 */
exports.getCricketMatchDetails = async (matchId) => {
  try {
    if (!CRICKET_API_KEY) {
      throw new Error('Cricket API key not configured');
    }

    const response = await axios.get(`${CRICKET_API_BASE}/match_info`, {
      params: {
        apikey: CRICKET_API_KEY,
        id: matchId
      }
    });

    return {
      success: response.data.status === 'success',
      data: response.data.data || null,
      provider: 'CricAPI'
    };
  } catch (error) {
    console.error('Error fetching match details:', error.message);
    throw error;
  }
};

/**
 * Get cricket series/tournaments
 */
exports.getCricketSeries = async () => {
  try {
    if (!CRICKET_API_KEY) {
      throw new Error('Cricket API key not configured');
    }

    const response = await axios.get(`${CRICKET_API_BASE}/series`, {
      params: {
        apikey: CRICKET_API_KEY,
        offset: 0
      }
    });

    return {
      success: response.data.status === 'success',
      data: response.data.data || [],
      provider: 'CricAPI'
    };
  } catch (error) {
    console.error('Error fetching cricket series:', error.message);
    throw error;
  }
};

/**
 * Get matches for a specific series
 */
exports.getCricketSeriesMatches = async (seriesId) => {
  try {
    if (!CRICKET_API_KEY) {
      throw new Error('Cricket API key not configured');
    }

    const response = await axios.get(`${CRICKET_API_BASE}/series_info`, {
      params: {
        apikey: CRICKET_API_KEY,
        id: seriesId
      }
    });

    return {
      success: response.data.status === 'success',
      data: response.data.data || {},
      provider: 'CricAPI'
    };
  } catch (error) {
    console.error('Error fetching series matches:', error.message);
    throw error;
  }
};

/**
 * Transform cricket match data to our Event schema
 */
exports.transformCricketMatchToEvent = (match) => {
  const homeTeam = match.teams && match.teams[0] ? match.teams[0] : 'TBD';
  const awayTeam = match.teams && match.teams[1] ? match.teams[1] : 'TBD';
  
  // Get scores if available
  let homeScore = null;
  let awayScore = null;
  if (match.score && match.score.length > 0) {
    homeScore = `${match.score[0].r}/${match.score[0].w} (${match.score[0].o} overs)`;
    if (match.score.length > 1) {
      awayScore = `${match.score[1].r}/${match.score[1].w} (${match.score[1].o} overs)`;
    }
  }

  return {
    externalId: match.id,
    title: match.name || `${homeTeam} vs ${awayTeam}`,
    sport: 'Cricket',
    league: match.series_id || 'Cricket Match',
    
    teams: {
      home: homeTeam,
      away: awayTeam
    },
    
    startTime: new Date(match.dateTimeGMT || match.date),
    endTime: new Date(new Date(match.dateTimeGMT || match.date).getTime() + 8 * 60 * 60 * 1000), // +8 hours
    
    location: match.venue || 'TBD',
    
    status: match.status || 'Upcoming',
    isLive: match.matchStarted && !match.matchEnded,
    
    cricketData: {
      matchType: match.matchType || 'unknown', // test, odi, t20
      homeScore: homeScore,
      awayScore: awayScore,
      matchStarted: match.matchStarted,
      matchEnded: match.matchEnded,
      teamInfo: match.teamInfo || []
    },
    
    provider: 'CricAPI'
  };
};

module.exports = exports;
