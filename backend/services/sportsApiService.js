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
    // Handle SportsDB sports (cricket, tennis, etc.)
    if (SPORTSDB_SPORTS.includes(sport)) {
      return await getTeamsFromSportsDB(sport);
    }
    
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
 * Get cricket matches specifically (upcoming fixtures and live status)
 * @returns {Object} - Cricket matches data
 */
exports.getCricketMatches = async () => {
  try {
    let allMatches = [];
    
    // Major cricket league IDs from TheSportsDB
    const cricketLeagues = [
      { id: 4344, name: 'Indian Premier League' },
      { id: 4424, name: 'Big Bash League' },
      { id: 4425, name: 'Pakistan Super League' },
      { id: 4426, name: 'Caribbean Premier League' },
      { id: 4427, name: 'Bangladesh Premier League' },
      { id: 4428, name: 'The Hundred' },
      { id: 4429, name: 'Vitality Blast' },
      { id: 4430, name: 'SA20' },
    ];

    // Get fixtures for next 30 days for each league
    const currentDate = new Date().toISOString().split('T')[0];
    
    const promises = cricketLeagues.map(async (league) => {
      try {
        // Get next fixtures for this league
        const response = await axios.get(
          `${SPORTS_DB_API}/${SPORTS_DB_KEY}/eventsnextleague.php?id=${league.id}`
        );
        
        if (response.data.events) {
          return response.data.events.map(event => ({
            ...event,
            leagueInfo: league,
            isUpcoming: true
          }));
        }
        return [];
      } catch (error) {
        console.log(`Failed to fetch ${league.name} fixtures:`, error.message);
        return [];
      }
    });

    // Wait for all league fixture requests
    const leagueResults = await Promise.all(promises);
    leagueResults.forEach(matches => {
      allMatches = [...allMatches, ...matches];
    });

    // Also get current season matches to check for live ones
    try {
      const currentResponse = await axios.get(
        `${SPORTS_DB_API}/${SPORTS_DB_KEY}/eventsseason.php?id=4344&s=2024-2025`
      );
      
      if (currentResponse.data.events) {
        const currentMatches = currentResponse.data.events.map(event => ({
          ...event,
          leagueInfo: { name: 'Indian Premier League' },
          isUpcoming: false
        }));
        allMatches = [...allMatches, ...currentMatches];
      }
    } catch (error) {
      console.log('Failed to fetch current season matches:', error.message);
    }

    // Filter for future matches and current live matches
    const now = new Date();
    const filteredMatches = allMatches.filter(match => {
      if (!match.dateEvent) return false;
      
      const matchDate = new Date(match.dateEvent);
      const status = (match.strStatus || '').toLowerCase();
      
      // Include if it's a future match or currently live
      return matchDate >= now || 
             status.includes('live') || 
             status.includes('in progress') ||
             status.includes('ongoing') ||
             status.includes('1st innings') ||
             status.includes('2nd innings');
    });

    return {
      success: true,
      matches: filteredMatches,
      sport: 'CRICKET',
      provider: 'SportsDB',
      totalMatches: filteredMatches.length
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
