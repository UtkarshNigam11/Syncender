const axios = require('axios');

// ESPN API base URLs for different sports
const ESPN_APIS = {
  nfl: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl',
  nba: 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  mlb: 'http://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
  nhl: 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl',
  soccer: 'http://site.api.espn.com/apis/site/v2/sports/soccer'
};

// Sports that use SportsDB API instead of ESPN
const SPORTSDB_SPORTS = ['cricket', 'tennis', 'rugby', 'formula1'];

// The Sports DB API base URL
const SPORTS_DB_API = 'https://www.thesportsdb.com/api/v1/json';
const SPORTS_DB_KEY = process.env.SPORTS_DB_API_KEY || '3'; // Free tier uses '3'

/**
 * Get live scores for a specific sport
 * @param {string} sport - Sport type (nfl, nba, mlb, nhl, soccer, cricket, tennis)
 * @returns {Object} - Live scores data
 */
exports.getLiveScores = async (sport) => {
  try {
    // Handle SportsDB sports (cricket, tennis, etc.)
    if (SPORTSDB_SPORTS.includes(sport)) {
      return await getCricketScoresFromSportsDB(sport);
    }
    
    // Handle ESPN sports
    if (!ESPN_APIS[sport]) {
      throw new Error(`Unsupported sport: ${sport}`);
    }
    
    const response = await axios.get(`${ESPN_APIS[sport]}/scoreboard`);
    return {
      success: true,
      data: response.data,
      sport: sport.toUpperCase(),
      provider: 'ESPN'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} scores:`, error.message);
    throw new Error(`Failed to fetch ${sport} scores`);
  }
};

/**
 * Get teams for a specific sport
 * @param {string} sport - Sport type
 * @returns {Object} - Teams data
 */
exports.getTeams = async (sport) => {
  try {
    // Handle SportsDB sports (cricket, tennis, etc.)
    if (SPORTSDB_SPORTS.includes(sport)) {
      return await getTeamsFromSportsDB(sport);
    }
    
    // Handle ESPN sports
    if (!ESPN_APIS[sport]) {
      throw new Error(`Unsupported sport: ${sport}`);
    }
    
    const response = await axios.get(`${ESPN_APIS[sport]}/teams`);
    return {
      success: true,
      data: response.data,
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
    // Handle SportsDB sports (cricket, tennis, etc.)
    if (SPORTSDB_SPORTS.includes(sport)) {
      return await getStandingsFromSportsDB(sport);
    }
    
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
 * Get detailed team information from SportsDB
 * @param {string} teamName - Team name to search
 * @returns {Object} - Team details
 */
exports.getTeamDetails = async (teamName) => {
  try {
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`
    );
    return {
      success: true,
      data: response.data.teams || [],
      searchTerm: teamName
    };
  } catch (error) {
    console.error('Error fetching team details:', error.message);
    throw new Error('Failed to fetch team details');
  }
};

/**
 * Get leagues from SportsDB
 * @returns {Object} - All available leagues
 */
exports.getAllLeagues = async () => {
  try {
    const response = await axios.get(`${SPORTS_DB_API}/${SPORTS_DB_KEY}/all_leagues.php`);
    return {
      success: true,
      data: response.data.leagues || []
    };
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    throw new Error('Failed to fetch leagues');
  }
};

/**
 * Get fixtures for a league
 * @param {string} leagueId - League ID from SportsDB
 * @returns {Object} - League fixtures
 */
exports.getLeagueFixtures = async (leagueId) => {
  try {
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/eventsnextleague.php?id=${leagueId}`
    );
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
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/searchplayers.php?p=${encodeURIComponent(playerName)}`
    );
    return {
      success: true,
      data: response.data.player || [],
      searchTerm: playerName
    };
  } catch (error) {
    console.error('Error searching player:', error.message);
    throw new Error('Failed to search player');
  }
};

/**
 * Get cricket matches specifically
 * @returns {Object} - Cricket matches data
 */
exports.getCricketMatches = async () => {
  try {
    // Get current IPL season matches
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/eventsseason.php?id=4344&s=2024-2025`
    );
    
    return {
      success: true,
      data: response.data.events || [],
      sport: 'CRICKET',
      provider: 'SportsDB',
      league: 'IPL 2024-2025'
    };
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
      { id: 'cricket', name: 'Cricket', provider: 'SportsDB' },
      { id: 'tennis', name: 'Tennis', provider: 'SportsDB' },
      { id: 'rugby', name: 'Rugby', provider: 'SportsDB' },
      { id: 'formula1', name: 'Formula 1', provider: 'SportsDB' }
    ]
  };
};

/**
 * Helper function to get cricket/tennis scores from SportsDB
 * @param {string} sport - Sport type
 * @returns {Object} - Live events data
 */
async function getCricketScoresFromSportsDB(sport) {
  try {
    // Get recent events for cricket (or other sport)
    const sportMap = {
      cricket: 'Cricket',
      tennis: 'Tennis',
      rugby: 'Rugby',
      formula1: 'Motor Sport'
    };
    
    const sportName = sportMap[sport] || 'Cricket';
    
    // Get events from the last 7 days and next 7 days
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/eventsround.php?id=4328&r=15&s=2024-2025`
    );
    
    return {
      success: true,
      data: response.data.events || [],
      sport: sport.toUpperCase(),
      provider: 'SportsDB',
      message: `Recent and upcoming ${sportName} events`
    };
  } catch (error) {
    console.error(`Error fetching ${sport} events:`, error.message);
    throw new Error(`Failed to fetch ${sport} events`);
  }
}

/**
 * Helper function to get teams from SportsDB for cricket/tennis
 * @param {string} sport - Sport type
 * @returns {Object} - Teams data
 */
async function getTeamsFromSportsDB(sport) {
  try {
    // For cricket, get IPL teams as an example
    const leagueMap = {
      cricket: '4344', // IPL league ID
      tennis: '4366', // ATP tour
      rugby: '4393', // Rugby World Cup
      formula1: '4370' // Formula 1
    };
    
    const leagueId = leagueMap[sport] || '4344';
    
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/lookup_all_teams.php?id=${leagueId}`
    );
    
    return {
      success: true,
      data: response.data.teams || [],
      sport: sport.toUpperCase(),
      provider: 'SportsDB'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} teams:`, error.message);
    throw new Error(`Failed to fetch ${sport} teams`);
  }
}

/**
 * Helper function to get standings from SportsDB
 * @param {string} sport - Sport type
 * @returns {Object} - Standings data
 */
async function getStandingsFromSportsDB(sport) {
  try {
    // For cricket, get IPL table as an example
    const leagueMap = {
      cricket: '4344', // IPL league ID
      tennis: '4366', // ATP rankings
      rugby: '4393', // Rugby standings
      formula1: '4370' // F1 standings
    };
    
    const leagueId = leagueMap[sport] || '4344';
    
    const response = await axios.get(
      `${SPORTS_DB_API}/${SPORTS_DB_KEY}/lookuptable.php?l=${leagueId}&s=2024-2025`
    );
    
    return {
      success: true,
      data: response.data.table || [],
      sport: sport.toUpperCase(),
      provider: 'SportsDB'
    };
  } catch (error) {
    console.error(`Error fetching ${sport} standings:`, error.message);
    throw new Error(`Failed to fetch ${sport} standings`);
  }
}
