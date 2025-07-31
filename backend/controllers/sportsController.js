const sportsApiService = require('../services/sportsApiService');

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
 */
exports.getCricketMatches = async (req, res) => {
  try {
    const matches = await sportsApiService.getCricketMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error getting cricket matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cricket matches',
      error: error.message
    });
  }
};
