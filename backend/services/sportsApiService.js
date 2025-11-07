const axios = require('axios');

// ESPN API base URLs for different sports
const ESPN_APIS = {
  nfl: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl',
  nba: 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  mlb: 'http://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
  nhl: 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl',
  soccer: 'http://site.api.espn.com/apis/site/v2/sports/soccer'
};

/**
 * Get live scores for a specific sport
 * @param {string} sport - Sport type (nfl, nba, mlb, nhl, soccer)
 * @returns {Object} - Live scores data
 */
exports.getLiveScores = async (sport) => {
  try {
    // Handle ESPN sports
    if (!ESPN_APIS[sport]) {
      throw new Error(`Unsupported sport: ${sport}`);
    }
    
    // For better live/upcoming games coverage, fetch current and upcoming games
    const today = new Date();
    const currentWeek = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Get current scoreboard (includes live games) 
    const currentResponse = await axios.get(`${ESPN_APIS[sport]}/scoreboard`);
    
    // Also try to get upcoming games for the next few days
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
    
    let upcomingGames = null;
    try {
      const upcomingResponse = await axios.get(`${ESPN_APIS[sport]}/scoreboard?dates=${tomorrowStr}`);
      upcomingGames = upcomingResponse.data;
    } catch (err) {
      console.log(`No upcoming games found for ${sport}:`, err.message);
    }
    
    // Combine current and upcoming games
    let combinedData = currentResponse.data;
    if (upcomingGames && upcomingGames.events && upcomingGames.events.length > 0) {
      combinedData.events = [...(currentResponse.data.events || []), ...upcomingGames.events];
    }
    
    return {
      success: true,
      data: combinedData,
      sport: sport.toUpperCase(),
      provider: 'ESPN'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} scores:`, error.message);
    throw new Error(`Failed to fetch ${sport} scores`);
  }
};

/**
 * Get soccer scores for a specific league (e.g., eng.1 for EPL, uefa.champions for UCL)
 * @param {string} league - League code under ESPN soccer (e.g., 'eng.1', 'uefa.champions')
 * @returns {Object} - Combined current and upcoming events for the league
 */
exports.getSoccerLeagueScores = async (league) => {
  try {
    if (!league || typeof league !== 'string') {
      throw new Error('League code is required (e.g., eng.1, uefa.champions)');
    }
    // Build base league URL under soccer
    const base = `${ESPN_APIS.soccer}/${league}`;

    // Today and tomorrow for better coverage
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');

    const currentResponse = await axios.get(`${base}/scoreboard`);

    let upcomingGames = null;
    try {
      const upcomingResponse = await axios.get(`${base}/scoreboard?dates=${tomorrowStr}`);
      upcomingGames = upcomingResponse.data;
    } catch (err) {
      console.log(`No upcoming games found for soccer league ${league}:`, err.message);
    }

    // Combine events
    let combinedData = currentResponse.data || {};
    if (upcomingGames && Array.isArray(upcomingGames.events) && upcomingGames.events.length > 0) {
      combinedData.events = [...(combinedData.events || []), ...upcomingGames.events];
    }

    // Attach a hint of league on the payload for consumers
    const leagueName = (combinedData?.leagues && combinedData.leagues[0]?.name) || league;

    return {
      success: true,
      data: combinedData,
      sport: 'SOCCER',
      league: leagueName,
      leagueCode: league,
      provider: 'ESPN'
    };
  } catch (error) {
    console.error(`Error fetching soccer league (${league}) scores:`, error.message);
    throw new Error(`Failed to fetch soccer league (${league}) scores`);
  }
};

/**
 * Get soccer teams for a league or default leagues (EPL, UCL)
 * @param {string|undefined} league - e.g., 'eng.1', 'uefa.champions'
 * @returns {Object}
 */
exports.getSoccerLeagueTeams = async (league) => {
  try {
    const leagues = league ? [league] : ['eng.1', 'uefa.champions'];
    let allTeams = [];

    for (const code of leagues) {
      try {
        const resp = await axios.get(`${ESPN_APIS.soccer}/${code}/teams`);
        const rawTeams = resp.data?.sports?.[0]?.leagues?.[0]?.teams || [];
        const leagueName = resp.data?.sports?.[0]?.leagues?.[0]?.name || code;
        const normalized = rawTeams.map((t) => {
          const tm = t.team || t;
          return {
            id: tm.id,
            name: tm.displayName || tm.name,
            shortName: tm.shortDisplayName || tm.name,
            abbreviation: tm.abbreviation,
            logo: (tm.logos && tm.logos[0]?.href) || tm.logo || '',
            location: tm.location,
            color: tm.color,
            league: leagueName,
            leagueCode: code,
          };
        });
        allTeams.push(...normalized);
      } catch (err) {
        console.log(`Failed to fetch soccer teams for league ${code}:`, err.message);
      }
    }

    // Deduplicate by id
    const byId = new Map();
    for (const t of allTeams) {
      if (!byId.has(t.id)) byId.set(t.id, t);
    }
    const teams = Array.from(byId.values());

    return {
      success: true,
      data: teams,
      count: teams.length,
      sport: 'SOCCER',
      provider: 'ESPN',
      leagues,
    };
  } catch (error) {
    console.error('Error fetching soccer league teams:', error.message);
    throw new Error('Failed to fetch soccer league teams');
  }
};

/**
 * Get teams for a specific sport
 * @param {string} sport - Sport type
 * @returns {Object} - Teams data
 */
exports.getTeams = async (sport, options = {}) => {
  try {
    // Handle ESPN sports
    if (!ESPN_APIS[sport]) {
      throw new Error(`Unsupported sport: ${sport}`);
    }
    
    // Soccer teams are league-specific; allow optional league param
    if (sport === 'soccer') {
      const { league } = options;
      return await exports.getSoccerLeagueTeams(league);
    }
    
    const response = await axios.get(`${ESPN_APIS[sport]}/teams`);
    const raw = response.data || {};
    // Normalize ESPN teams payload to a simple array for frontend
    let teams = [];
    try {
      const espnTeams = raw?.sports?.[0]?.leagues?.[0]?.teams || [];
      teams = espnTeams.map((t) => {
        const tm = t.team || t;
        return {
          id: tm.id,
          name: tm.displayName || tm.name,
          shortName: tm.shortDisplayName || tm.name,
          abbreviation: tm.abbreviation,
          logo: (tm.logos && tm.logos[0]?.href) || tm.logo || '',
          location: tm.location,
          color: tm.color,
        };
      });
    } catch (e) {
      console.log('Failed to normalize ESPN teams payload:', e.message);
    }

    return {
      success: true,
      data: teams,
      count: teams.length,
      sport: sport.toUpperCase(),
      provider: 'ESPN'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} teams:`, error.message);
    throw new Error(`Failed to fetch ${sport} teams`);
  }
};

/**
 * Get standings for a specific sport
 * @param {string} sport - Sport type
 * @returns {Object} - Standings data
 */
exports.getStandings = async (sport) => {
  try {
    // Handle ESPN sports
    if (!ESPN_APIS[sport]) {
      throw new Error(`Unsupported sport: ${sport}`);
    }
    
    const response = await axios.get(`${ESPN_APIS[sport]}/standings`);
    return {
      success: true,
      data: response.data,
      sport: sport.toUpperCase(),
      provider: 'ESPN'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} standings:`, error.message);
    throw new Error(`Failed to fetch ${sport} standings`);
  }
};

/**
 * Get detailed team information
 * @param {string} teamName - Team name to search
 * @returns {Object} - Team details
 */
exports.getTeamDetails = async (teamName) => {
  try {
    // For now, return basic team search - can be enhanced with ESPN team lookup
    return {
      success: true,
      data: [],
      searchTerm: teamName,
      message: 'Team details feature coming soon'
    };
  } catch (error) {
    console.error('Error fetching team details:', error.message);
    throw new Error('Failed to fetch team details');
  }
};

/**
 * Get all available leagues
 * @returns {Object} - All available leagues
 */
exports.getAllLeagues = async () => {
  try {
    // Return supported ESPN leagues
    return {
      success: true,
      data: [
        { id: 'nfl', name: 'NFL', provider: 'ESPN' },
        { id: 'nba', name: 'NBA', provider: 'ESPN' },
        { id: 'eng.1', name: 'Premier League', provider: 'ESPN' },
        { id: 'uefa.champions', name: 'UEFA Champions League', provider: 'ESPN' },
        { id: 'cricket', name: 'Cricket', provider: 'CricAPI' }
      ]
    };
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    throw new Error('Failed to fetch leagues');
  }
};

/**
 * Get fixtures for a league
 * @param {string} leagueId - League ID
 * @returns {Object} - League fixtures
 */
exports.getLeagueFixtures = async (leagueId) => {
  try {
    // Use appropriate API based on league
    if (leagueId === 'cricket') {
      const cricketService = require('./cricketApiService');
      return await cricketService.getCricketMatches();
    }
    
    // For ESPN leagues
    const response = await axios.get(`${ESPN_APIS[leagueId]}/scoreboard`);
    return {
      success: true,
      data: response.data.events || [],
      leagueId
    };
  } catch (error) {
    console.error('Error fetching league fixtures:', error.message);
    throw new Error('Failed to fetch league fixtures');
  }
};

/**
 * Search for players
 * @param {string} playerName - Player name to search
 * @returns {Object} - Player search results
 */
exports.searchPlayer = async (playerName) => {
  try {
    // Player search feature coming soon
    return {
      success: true,
      data: [],
      searchTerm: playerName,
      message: 'Player search feature coming soon'
    };
  } catch (error) {
    console.error('Error searching player:', error.message);
    throw new Error('Failed to search player');
  }
};

/**
 * Get cricket matches specifically (upcoming fixtures and live status)
 * Uses CricAPI service
 * @returns {Object} - Cricket matches data
 */
exports.getCricketMatches = async () => {
  try {
    // Use the new cricket API service
    const cricketService = require('./cricketApiService');
    return await cricketService.getCricketMatches();
  } catch (error) {
    console.error('Error fetching cricket matches:', error.message);
    throw new Error('Failed to fetch cricket matches');
  }
};

/**
 * Get available sports list
 * @returns {Object} - List of supported sports
 */
exports.getSupportedSports = () => {
  return {
    success: true,
    data: [
      { id: 'nfl', name: 'NFL (American Football)', provider: 'ESPN' },
      { id: 'nba', name: 'NBA (Basketball)', provider: 'ESPN' },
      { id: 'mlb', name: 'MLB (Baseball)', provider: 'ESPN' },
      { id: 'nhl', name: 'NHL (Hockey)', provider: 'ESPN' },
      { id: 'soccer', name: 'Soccer/Football', provider: 'ESPN' },
      { id: 'cricket', name: 'Cricket', provider: 'CricAPI' }
    ]
  };
};
