const sportsApiService = require('../services/sportsApiService');

// In-memory cache for teams data (teams rarely change)
const teamsCache = {
  soccer: new Map(), // Map of league -> teams
  cricket: new Map(), // Map of league -> teams
  nfl: { data: null, timestamp: null },
  nba: { data: null, timestamp: null }
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get supported sports list
 */
exports.getSports = async (req, res) => {
  try {
    const sports = sportsApiService.getSupportedSports();
    res.json(sports);
  } catch (error) {
    console.error('Error getting sports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sports list',
      error: error.message
    });
  }
};

/**
 * Get live scores for a sport
 */
exports.getLiveScores = async (req, res) => {
  try {
    const { sport } = req.params;
    const scores = await sportsApiService.getLiveScores(sport);
    res.json(scores);
  } catch (error) {
    console.error('Error getting live scores:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get live scores for ${req.params.sport}`,
      error: error.message
    });
  }
};

/**
 * Get teams for a sport
 */
exports.getTeams = async (req, res) => {
  try {
    const { sport } = req.params;
    const { league } = req.query;
    
    // For soccer and cricket, allow league query
    if (sport === 'soccer' || sport === 'cricket') {
      const teams = await sportsApiService.getTeams(sport, { league });
      return res.json(teams);
    }
    
    const teams = await sportsApiService.getTeams(sport);
    res.json(teams);
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get teams for ${req.params.sport}`,
      error: error.message
    });
  }
};

/**
 * Get Soccer teams by league (with caching)
 */
exports.getSoccerTeams = async (req, res) => {
  try {
    const { league } = req.query; // e.g., eng.1, uefa.champions
    
    if (!league) {
      return res.status(400).json({
        success: false,
        message: 'League parameter is required (e.g., ?league=eng.1)'
      });
    }

    // Check cache first
    const cached = teamsCache.soccer.get(league);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`✅ Returning cached soccer teams for ${league}`);
      return res.json(cached.data);
    }

    // Fetch teams from ESPN API
    const response = await require('axios').get(
      `http://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams`
    );

    const teams = response.data.sports?.[0]?.leagues?.[0]?.teams?.map(teamData => ({
      id: teamData.team?.id,
      name: teamData.team?.displayName || teamData.team?.name,
      shortName: teamData.team?.shortDisplayName,
      abbreviation: teamData.team?.abbreviation,
      logo: teamData.team?.logos?.[0]?.href,
      location: teamData.team?.location,
      color: teamData.team?.color,
      league: response.data.sports?.[0]?.leagues?.[0]?.name,
      leagueCode: league,
    })) || [];

    const responseData = {
      success: true,
      data: teams,
      league,
      count: teams.length
    };

    // Cache the result
    teamsCache.soccer.set(league, {
      data: responseData,
      timestamp: Date.now()
    });
    console.log(`💾 Cached soccer teams for ${league}`);

    res.json(responseData);
  } catch (error) {
    console.error('Error getting soccer teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get soccer teams',
      error: error.message
    });
  }
};

/**
 * Get Cricket teams by league (with caching)
 */
exports.getCricketTeams = async (req, res) => {
  try {
    const { league } = req.query; // e.g., ipl, bbl, psl
    
    // Check cache first
    const cached = teamsCache.cricket.get(league?.toLowerCase());
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`✅ Returning cached cricket teams for ${league}`);
      return res.json(cached.data);
    }
    
    // CricAPI doesn't have a direct teams endpoint, so we use curated team lists
    // with proper logos from Wikipedia/official sources
    const cricketTeams = {
      'ipl': [
        { id: 'MI', name: 'Mumbai Indians', shortName: 'MI', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/200px-Mumbai_Indians_Logo.svg.png', location: 'Mumbai', color: '004BA0' },
        { id: 'CSK', name: 'Chennai Super Kings', shortName: 'CSK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/200px-Chennai_Super_Kings_Logo.svg.png', location: 'Chennai', color: 'FDB913' },
        { id: 'RCB', name: 'Royal Challengers Bangalore', shortName: 'RCB', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Royal_Challengers_Bangalore_2020.svg/200px-Royal_Challengers_Bangalore_2020.svg.png', location: 'Bangalore', color: 'EC1C24' },
        { id: 'KKR', name: 'Kolkata Knight Riders', shortName: 'KKR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/200px-Kolkata_Knight_Riders_Logo.svg.png', location: 'Kolkata', color: '3A225D' },
        { id: 'DC', name: 'Delhi Capitals', shortName: 'DC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/200px-Delhi_Capitals_Logo.svg.png', location: 'Delhi', color: '004C93' },
        { id: 'PBKS', name: 'Punjab Kings', shortName: 'PBKS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Punjab_Kings_Logo.svg/200px-Punjab_Kings_Logo.svg.png', location: 'Punjab', color: 'ED1B24' },
        { id: 'RR', name: 'Rajasthan Royals', shortName: 'RR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/200px-Rajasthan_Royals_Logo.svg.png', location: 'Jaipur', color: 'EA1A85' },
        { id: 'SRH', name: 'Sunrisers Hyderabad', shortName: 'SRH', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/200px-Sunrisers_Hyderabad.svg.png', location: 'Hyderabad', color: 'FF822A' },
        { id: 'GT', name: 'Gujarat Titans', shortName: 'GT', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/200px-Gujarat_Titans_Logo.svg.png', location: 'Ahmedabad', color: '1C2E4A' },
        { id: 'LSG', name: 'Lucknow Super Giants', shortName: 'LSG', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Lucknow_Super_Giants_Logo.svg/200px-Lucknow_Super_Giants_Logo.svg.png', location: 'Lucknow', color: '00A1DE' },
      ],
      'icc': [
        { id: 'IND', name: 'India', shortName: 'IND', logo: 'https://cdorg.b-cdn.net/flags/generic/IN.svg', location: 'India', color: '138808' },
        { id: 'AUS', name: 'Australia', shortName: 'AUS', logo: 'https://cdorg.b-cdn.net/flags/generic/AU.svg', location: 'Australia', color: 'FFC600' },
        { id: 'ENG', name: 'England', shortName: 'ENG', logo: 'https://cdorg.b-cdn.net/flags/generic/GB.svg', location: 'England', color: 'C8102E' },
        { id: 'PAK', name: 'Pakistan', shortName: 'PAK', logo: 'https://cdorg.b-cdn.net/flags/generic/PK.svg', location: 'Pakistan', color: '01411C' },
        { id: 'SA', name: 'South Africa', shortName: 'SA', logo: 'https://cdorg.b-cdn.net/flags/generic/ZA.svg', location: 'South Africa', color: '007A4D' },
        { id: 'NZ', name: 'New Zealand', shortName: 'NZ', logo: 'https://cdorg.b-cdn.net/flags/generic/NZ.svg', location: 'New Zealand', color: '000000' },
        { id: 'WI', name: 'West Indies', shortName: 'WI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_West_Indies_Federation.svg/200px-Flag_of_the_West_Indies_Federation.svg.png', location: 'Caribbean', color: '7B0041' },
        { id: 'SL', name: 'Sri Lanka', shortName: 'SL', logo: 'https://cdorg.b-cdn.net/flags/generic/LK.svg', location: 'Sri Lanka', color: '8B0000' },
        { id: 'BAN', name: 'Bangladesh', shortName: 'BAN', logo: 'https://cdorg.b-cdn.net/flags/generic/BD.svg', location: 'Bangladesh', color: '006A4E' },
        { id: 'AFG', name: 'Afghanistan', shortName: 'AFG', logo: 'https://cdorg.b-cdn.net/flags/generic/AF.svg', location: 'Afghanistan', color: 'D32011' },
      ],
      'bbl': [
        { id: 'STR', name: 'Adelaide Strikers', shortName: 'Strikers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/Adelaide_Strikers.svg/200px-Adelaide_Strikers.svg.png', location: 'Adelaide', color: '00A0DC' },
        { id: 'HEA', name: 'Brisbane Heat', shortName: 'Heat', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/62/Brisbane_Heat.svg/200px-Brisbane_Heat.svg.png', location: 'Brisbane', color: 'FF6900' },
        { id: 'HUR', name: 'Hobart Hurricanes', shortName: 'Hurricanes', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Hobart_Hurricanes.svg/200px-Hobart_Hurricanes.svg.png', location: 'Hobart', color: '6A2C91' },
        { id: 'STA', name: 'Melbourne Stars', shortName: 'Stars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Melbourne_Stars.svg/200px-Melbourne_Stars.svg.png', location: 'Melbourne', color: '00843D' },
        { id: 'REN', name: 'Melbourne Renegades', shortName: 'Renegades', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/Melbourne_Renegades.svg/200px-Melbourne_Renegades.svg.png', location: 'Melbourne', color: 'ED1B24' },
        { id: 'SCO', name: 'Perth Scorchers', shortName: 'Scorchers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Perth_Scorchers.svg/200px-Perth_Scorchers.svg.png', location: 'Perth', color: 'FF6900' },
        { id: 'SIX', name: 'Sydney Sixers', shortName: 'Sixers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d9/Sydney_Sixers.svg/200px-Sydney_Sixers.svg.png', location: 'Sydney', color: 'ED0677' },
        { id: 'THU', name: 'Sydney Thunder', shortName: 'Thunder', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Sydney_Thunder.svg/200px-Sydney_Thunder.svg.png', location: 'Sydney', color: '4EC200' },
      ],
      'psl': [
        { id: 'ISL', name: 'Islamabad United', shortName: 'United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Islamabad_United_Logo.svg/200px-Islamabad_United_Logo.svg.png', location: 'Islamabad', color: 'DC1F26' },
        { id: 'KAR', name: 'Karachi Kings', shortName: 'Kings', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Karachi_Kings_Logo.svg/200px-Karachi_Kings_Logo.svg.png', location: 'Karachi', color: '003087' },
        { id: 'LAH', name: 'Lahore Qalandars', shortName: 'Qalandars', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Lahore_Qalandars_logo.svg/200px-Lahore_Qalandars_logo.svg.png', location: 'Lahore', color: '78BC43' },
        { id: 'MUL', name: 'Multan Sultans', shortName: 'Sultans', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Multan_Sultans_Logo.svg/200px-Multan_Sultans_Logo.svg.png', location: 'Multan', color: 'FFC60A' },
        { id: 'PES', name: 'Peshawar Zalmi', shortName: 'Zalmi', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Peshawar_Zalmi_Logo.svg/200px-Peshawar_Zalmi_Logo.svg.png', location: 'Peshawar', color: 'FFD700' },
        { id: 'QUE', name: 'Quetta Gladiators', shortName: 'Gladiators', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Quetta_Gladiators_Logo.svg/200px-Quetta_Gladiators_Logo.svg.png', location: 'Quetta', color: '9B30FF' },
      ],
    };

    const teams = cricketTeams[league?.toLowerCase()] || [];
    
    const responseData = {
      success: true,
      data: teams,
      league: league?.toLowerCase(),
      count: teams.length
    };

    // Cache the result
    teamsCache.cricket.set(league?.toLowerCase(), {
      data: responseData,
      timestamp: Date.now()
    });
    console.log(`💾 Cached cricket teams for ${league}`);

    res.json(responseData);
  } catch (error) {
    console.error('Error getting cricket teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cricket teams',
      error: error.message
    });
  }
};

/**
 * Get NFL teams (with caching)
 */
exports.getNFLTeams = async (req, res) => {
  try {
    // Check cache first
    if (teamsCache.nfl.data && (Date.now() - teamsCache.nfl.timestamp < CACHE_DURATION)) {
      console.log(`✅ Returning cached NFL teams`);
      return res.json(teamsCache.nfl.data);
    }

    const response = await require('axios').get(
      'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams'
    );

    const teams = response.data.sports?.[0]?.leagues?.[0]?.teams?.map(teamData => ({
      id: teamData.team?.id,
      name: teamData.team?.displayName || teamData.team?.name,
      shortName: teamData.team?.shortDisplayName,
      abbreviation: teamData.team?.abbreviation,
      logo: teamData.team?.logos?.[0]?.href,
      location: teamData.team?.location,
      color: teamData.team?.color,
    })) || [];

    const responseData = {
      success: true,
      data: teams,
      count: teams.length
    };

    // Cache the result
    teamsCache.nfl.data = responseData;
    teamsCache.nfl.timestamp = Date.now();
    console.log(`💾 Cached ${teams.length} NFL teams`);

    res.json(responseData);
  } catch (error) {
    console.error('Error getting NFL teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get NFL teams',
      error: error.message
    });
  }
};

/**
 * Get NBA teams (with caching)
 */
exports.getNBATeams = async (req, res) => {
  try {
    // Check cache first
    if (teamsCache.nba.data && (Date.now() - teamsCache.nba.timestamp < CACHE_DURATION)) {
      console.log(`✅ Returning cached NBA teams`);
      return res.json(teamsCache.nba.data);
    }

    const response = await require('axios').get(
      'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams'
    );

    const teams = response.data.sports?.[0]?.leagues?.[0]?.teams?.map(teamData => ({
      id: teamData.team?.id,
      name: teamData.team?.displayName || teamData.team?.name,
      shortName: teamData.team?.shortDisplayName,
      abbreviation: teamData.team?.abbreviation,
      logo: teamData.team?.logos?.[0]?.href,
      location: teamData.team?.location,
      color: teamData.team?.color,
    })) || [];

    const responseData = {
      success: true,
      data: teams,
      count: teams.length
    };

    // Cache the result
    teamsCache.nba.data = responseData;
    teamsCache.nba.timestamp = Date.now();
    console.log(`💾 Cached ${teams.length} NBA teams`);

    res.json(responseData);
  } catch (error) {
    console.error('Error getting NBA teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get NBA teams',
      error: error.message
    });
  }
};

/**
 * Get standings for a sport
 */
exports.getStandings = async (req, res) => {
  try {
    const { sport } = req.params;
    const standings = await sportsApiService.getStandings(sport);
    res.json(standings);
  } catch (error) {
    console.error('Error getting standings:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get standings for ${req.params.sport}`,
      error: error.message
    });
  }
};

/**
 * Get soccer league specific scores (e.g., EPL, UCL)
 */
exports.getSoccerLeagueScores = async (req, res) => {
  try {
    const { league } = req.params; // e.g., 'eng.1', 'uefa.champions'
    const scores = await sportsApiService.getSoccerLeagueScores(league);
    res.json(scores);
  } catch (error) {
    console.error('Error getting soccer league scores:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get soccer league scores for ${req.params.league}`,
      error: error.message
    });
  }
};

/**
 * Get team details
 */
exports.getTeamDetails = async (req, res) => {
  try {
    const { teamName } = req.params;
    const teamDetails = await sportsApiService.getTeamDetails(teamName);
    res.json(teamDetails);
  } catch (error) {
    console.error('Error getting team details:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get details for team: ${req.params.teamName}`,
      error: error.message
    });
  }
};

/**
 * Get all leagues
 */
exports.getLeagues = async (req, res) => {
  try {
    const leagues = await sportsApiService.getAllLeagues();
    res.json(leagues);
  } catch (error) {
    console.error('Error getting leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leagues',
      error: error.message
    });
  }
};

/**
 * Get league fixtures
 */
exports.getLeagueFixtures = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const fixtures = await sportsApiService.getLeagueFixtures(leagueId);
    res.json(fixtures);
  } catch (error) {
    console.error('Error getting league fixtures:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get fixtures for league: ${req.params.leagueId}`,
      error: error.message
    });
  }
};

/**
 * Search for players
 */
exports.searchPlayer = async (req, res) => {
  try {
    const { playerName } = req.params;
    const players = await sportsApiService.searchPlayer(playerName);
    res.json(players);
  } catch (error) {
    console.error('Error searching player:', error);
    res.status(500).json({
      success: false,
      message: `Failed to search for player: ${req.params.playerName}`,
      error: error.message
    });
  }
};

/**
 * Create event from sports data
 */
exports.createEventFromSportsData = async (req, res) => {
  try {
    const { gameId, sport, teams, gameTime, venue } = req.body;
    
    // Validation
    if (!gameId || !sport || !teams || !gameTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: gameId, sport, teams, gameTime'
      });
    }

    // Create event data structure
    const eventData = {
      title: `${teams.home} vs ${teams.away}`,
      description: `${sport.toUpperCase()} Game`,
      startTime: gameTime,
      endTime: new Date(new Date(gameTime).getTime() + 3 * 60 * 60 * 1000), // Add 3 hours
      sport: sport,
      teams: teams,
      location: venue || 'TBD',
      source: 'sports_api',
      externalIds: {
        sportsApi: gameId
      }
    };

    // You can extend this to automatically create an event in the database
    // const Event = require('../models/Event');
    // const newEvent = new Event({ ...eventData, user: req.user.userId });
    // await newEvent.save();

    res.json({
      success: true,
      message: 'Event data prepared successfully',
      eventData
    });
  } catch (error) {
    console.error('Error creating event from sports data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event from sports data',
      error: error.message
    });
  }
};

/**
 * Get cricket matches specifically (IPL, international, etc.)
 * Now uses database cache instead of direct API calls
 */
exports.getCricketMatches = async (req, res) => {
  try {
    const cricketCacheService = require('../services/cricketCacheService');
    
    // Get from cache (no API call)
    const result = await cricketCacheService.getMatchesFromCache({
      daysAhead: 7,
      daysBack: 2,
      includeCompleted: true,
      includeLive: true,
      includeUpcoming: true
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting cricket matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cricket matches',
      error: error.message,
      matches: []
    });
  }
};

/**
 * Force sync cricket matches (admin endpoint)
 */
exports.syncCricketMatches = async (req, res) => {
  try {
    const cricketCacheService = require('../services/cricketCacheService');
    const result = await cricketCacheService.forceSyncNow();
    
    res.json({
      success: true,
      message: 'Cricket matches sync completed',
      ...result
    });
  } catch (error) {
    console.error('Error syncing cricket matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync cricket matches',
      error: error.message
    });
  }
};

/**
 * Clean up old cricket matches (admin endpoint)
 */
exports.cleanupCricketMatches = async (req, res) => {
  try {
    const cricketCacheService = require('../services/cricketCacheService');
    const { days = 7 } = req.query; // Default 7 days
    
    const result = await cricketCacheService.cleanupOldMatches(parseInt(days));
    
    res.json({
      success: true,
      message: `Cleaned up matches older than ${days} days`,
      ...result
    });
  } catch (error) {
    console.error('Error cleaning up cricket matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup cricket matches',
      error: error.message
    });
  }
};

/**
 * Get cricket cache statistics (admin endpoint)
 */
exports.getCricketCacheStats = async (req, res) => {
  try {
    const cricketCacheService = require('../services/cricketCacheService');
    const stats = await cricketCacheService.getCacheStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cricket cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
};

/**
 * Cleanup old cricket matches (admin endpoint)
 */
exports.cleanupCricketMatches = async (req, res) => {
  try {
    const cricketCacheService = require('../services/cricketCacheService');
    const { daysToKeep = 7 } = req.query;
    
    const result = await cricketCacheService.cleanupOldMatches(parseInt(daysToKeep));
    
    res.json({
      success: true,
      message: `Cleaned up matches older than ${daysToKeep} days`,
      ...result
    });
  } catch (error) {
    console.error('Error cleaning up cricket matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup cricket matches',
      error: error.message
    });
  }
};

/**
 * Get cricket cache stats (admin endpoint)
 */
exports.getCricketCacheStats = async (req, res) => {
  try {
    const CricketMatch = require('../models/CricketMatch');
    const cricketScheduler = require('../services/cricketScheduler');
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      totalMatches,
      liveMatches,
      upcomingMatches,
      recentMatches,
      oldMatches,
      lastFetched
    ] = await Promise.all([
      CricketMatch.countDocuments(),
      CricketMatch.countDocuments({ matchStarted: true, matchEnded: false }),
      CricketMatch.countDocuments({ 
        matchStarted: false, 
        dateTimeGMT: { $gte: now } 
      }),
      CricketMatch.countDocuments({ 
        matchEnded: true, 
        dateTimeGMT: { $gte: sevenDaysAgo } 
      }),
      CricketMatch.countDocuments({ 
        dateTimeGMT: { $lt: sevenDaysAgo } 
      }),
      CricketMatch.findOne().sort({ lastFetched: -1 }).select('lastFetched')
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalMatches,
        live: liveMatches,
        upcoming: upcomingMatches,
        recent: recentMatches,
        old: oldMatches,
        lastFetched: lastFetched?.lastFetched || null
      },
      scheduler: cricketScheduler.getSchedulerStatus()
    });
  } catch (error) {
    console.error('Error getting cricket cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
};

/**
 * Get unified dashboard data - all sports live and upcoming games
 * This endpoint consolidates data from multiple sports APIs
 * Supports ?refresh=true to bypass cache (all data)
 * Supports ?refreshLive=true to refresh only live matches (recommended)
 */
exports.getDashboardData = async (req, res) => {
  try {
    console.log('📊 Fetching unified dashboard data...');
    
    // Check if refresh is requested
    const forceRefresh = req.query.refresh === 'true';
    const refreshLive = req.query.refreshLive === 'true';
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - bypassing ALL cache');
    } else if (refreshLive) {
      console.log('🔄 Live refresh requested - clearing live match cache only');
      const sportsCacheService = require('../services/sportsCacheService');
      sportsCacheService.clearLiveCache();
    }
    
    // Use cache services
    const cricketCacheService = require('../services/cricketCacheService');
    const sportsCacheService = require('../services/sportsCacheService');
    const eventCleanupService = require('../services/eventCleanupService');
    
    // Fetch all sports data in parallel
    // forceRefresh bypasses all caches
    // refreshLive only clears live cache (will refetch sooner but upcoming may still be cached)
    const [nflData, nbaData, eplData, uclData, cricketData, completedMatches] = await Promise.allSettled([
      sportsCacheService.getNFLData(forceRefresh),
      sportsCacheService.getNBAData(forceRefresh),
      sportsCacheService.getEPLData(forceRefresh),
      sportsCacheService.getUCLData(forceRefresh),
      cricketCacheService.getMatchesFromCache({ daysAhead: 7, daysBack: 2 }),
      eventCleanupService.getRecentCompletedMatches()
    ]);

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Helper function to extract and normalize matches from different API formats
    const extractMatches = (data, sportName, leagueName) => {
      if (!data || data.status === 'rejected') return [];
      
      const apiData = data.value?.data || data.value;
      const matches = [];

      // ESPN format (NFL, NBA, Soccer)
      if (apiData && apiData.events && Array.isArray(apiData.events)) {
        const league = leagueName || apiData.league || apiData.leagues?.[0]?.name || sportName;
        
        apiData.events.forEach((event, index) => {
          const eventDate = new Date(event.date);
          const state = event.status?.type?.state;
          const statusName = event.status?.type?.name;
          
          // Determine if live
          const isLive = state === 'in' || state === 'live' || state === 'inprogress' || 
                        statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_LIVE';
          
          // Determine if upcoming (scheduled within next 7 days)
          const isScheduled = state === 'pre' || statusName === 'STATUS_SCHEDULED';
          const isUpcoming = (isScheduled && eventDate >= now && eventDate <= sevenDaysLater) || 
                           (eventDate >= now && eventDate <= threeDaysLater && !isLive && state !== 'post');
          
          const homeCompetitor = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
          const awayCompetitor = event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
          
          // Create unique ID: use event.id if available, otherwise create composite key
          // Add both sport and league prefix to prevent duplicates across sports/leagues
          // Also add timestamp component for extra uniqueness
          const safeLeague = (league || sportName).replace(/\s+/g, '-').toLowerCase();
          const safeSport = sportName.replace(/\s+/g, '-').toLowerCase();
          const uniqueId = event.id 
            ? `${safeSport}-${safeLeague}-${event.id}` 
            : `${safeSport}-${safeLeague}-${index}-${Date.now()}`;
          
          matches.push({
            id: uniqueId,
            sport: sportName,
            homeTeam: homeCompetitor?.team?.displayName || 'Home Team',
            awayTeam: awayCompetitor?.team?.displayName || 'Away Team',
            homeScore: homeCompetitor?.score || '0',
            awayScore: awayCompetitor?.score || '0',
            status: event.status?.type?.description || 'Scheduled',
            venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
            date: event.date,
            league: league,
            isLive,
            isUpcoming,
            isFinal: state === 'post' || statusName === 'STATUS_FINAL'
          });
        });
      }

      return matches;
    };

    // Helper for cricket matches (from cache - different format)
    const extractCricketMatches = (data) => {
      if (!data || data.status === 'rejected') return [];
      
      const cacheData = data.value;
      const matches = [];
      
      // Cache returns {live: [], upcoming: [], recent: []}
      const allCricketMatches = [
        ...(cacheData?.live || []),
        ...(cacheData?.upcoming || []),
        ...(cacheData?.recent || [])
      ];

      allCricketMatches.forEach((event, index) => {
        const matchDate = event.dateTimeGMT ? new Date(event.dateTimeGMT) : new Date();
        const isLive = event.matchStarted && !event.matchEnded;
        const isUpcoming = matchDate >= now && matchDate <= threeDaysLater && !event.matchStarted;
        const isFinal = event.matchEnded;
        
        // Extract scores from API - format: [{r: runs, w: wickets, o: overs, inning: string}]
        let homeScore = '-';
        let awayScore = '-';
        
        if (event.score && Array.isArray(event.score) && event.score.length > 0) {
          // Get the latest innings for each team
          const team1Innings = event.score.filter(s => s.inning && s.inning.includes(event.teams?.[0]));
          const team2Innings = event.score.filter(s => s.inning && s.inning.includes(event.teams?.[1]));
          
          // Use the last (most recent) inning for each team
          if (team1Innings.length > 0) {
            const latestInning = team1Innings[team1Innings.length - 1];
            homeScore = `${latestInning.r}/${latestInning.w}`;
            if (latestInning.o) homeScore += ` (${latestInning.o})`;
          }
          
          if (team2Innings.length > 0) {
            const latestInning = team2Innings[team2Innings.length - 1];
            awayScore = `${latestInning.r}/${latestInning.w}`;
            if (latestInning.o) awayScore += ` (${latestInning.o})`;
          }
        }
        
        // Create unique ID with cricket prefix
        const uniqueId = event.matchId ? `cricket-${event.matchId}` : (event._id ? `cricket-${event._id}` : `cricket-${index}-${Date.now()}`);

        matches.push({
          id: uniqueId,
          sport: 'Cricket',
          homeTeam: event.teams?.[0] || 'Team 1',
          awayTeam: event.teams?.[1] || 'Team 2',
          homeScore,  // Store actual scores
          awayScore,  // Store actual scores
          status: event.status || 'Scheduled',
          venue: event.venue || 'TBD',
          date: event.dateTimeGMT || new Date(),
          league: event.matchType ? event.matchType.toUpperCase() : 'Cricket',
          matchType: event.matchType,
          isLive,
          isUpcoming,
          isFinal
        });
      });

      return matches;
    };

    // Extract all matches
    const allMatchesRaw = [
      ...extractMatches(nflData, 'NFL'),
      ...extractMatches(nbaData, 'NBA'),
      ...extractMatches(eplData, 'Soccer', 'English Premier League'),
      ...extractMatches(uclData, 'Soccer', 'UEFA Champions League'),
      ...extractCricketMatches(cricketData)
    ];

    // Deduplicate matches by ID (in case same event appears in multiple API responses)
    const seenIds = new Set();
    const allMatches = allMatchesRaw.filter(match => {
      if (seenIds.has(match.id)) {
        console.log(`⚠️  Removing duplicate match ID: ${match.id} - ${match.homeTeam} vs ${match.awayTeam}`);
        return false;
      }
      seenIds.add(match.id);
      return true;
    });

    console.log(`📋 Total matches: ${allMatchesRaw.length} raw, ${allMatches.length} after deduplication`);

    // Filter and sort
    const liveGames = allMatches.filter(m => m.isLive);
    console.log(`🎯 Filtered results: ${liveGames.length} live games (${liveGames.filter(g => g.sport === 'Cricket').length} cricket)`);
    const upcomingGames = allMatches
      .filter(m => m.isUpcoming)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get finished/completed matches from API data (isFinal = true)
    const finishedGames = allMatches
      .filter(m => m.isFinal && !m.isLive)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    
    // Also include completed matches from database (last 3 days) for events user added
    if (completedMatches.status === 'fulfilled' && completedMatches.value?.length) {
      completedMatches.value.forEach((event, index) => {
        // Create unique ID for completed events from database
        const uniqueId = event._id ? `completed-db-${event._id}` : `completed-${index}-${Date.now()}`;
        
        finishedGames.push({
          id: uniqueId,
          sport: event.sport || 'Unknown',
          homeTeam: event.teams?.home || event.title?.split('vs')[0]?.trim() || 'Team 1',
          awayTeam: event.teams?.away || event.title?.split('vs')[1]?.trim() || 'Team 2',
          homeScore: '-',
          awayScore: '-',
          status: 'Final',
          venue: event.location || 'TBD',
          date: event.startTime,
          league: event.sport || 'General',
          isLive: false,
          isUpcoming: false,
          isFinal: true,
          isCompleted: true
        });
      });
    }
    
    const completedGames = finishedGames;

    console.log(`✅ Dashboard data: ${liveGames.length} live, ${upcomingGames.length} upcoming, ${completedGames.length} completed`);
    
    res.json({
      success: true,
      data: {
        liveGames,
        upcomingGames,
        completedGames,
        totalGames: allMatches.length + completedGames.length,
        stats: {
          liveCount: liveGames.length,
          upcomingCount: upcomingGames.length,
          completedCount: completedGames.length,
          sportsTracked: 4, // NFL, NBA, Soccer, Cricket
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message,
      data: {
        liveGames: [],
        upcomingGames: [],
        completedGames: [],
        totalGames: 0
      }
    });
  }
};
