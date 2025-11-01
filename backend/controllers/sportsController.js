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

/**
 * Get unified dashboard data - all sports live and upcoming games
 * This endpoint consolidates data from multiple sports APIs
 */
exports.getDashboardData = async (req, res) => {
  try {
    console.log('📊 Fetching unified dashboard data...');
    
    // Fetch all sports data in parallel
    const [nflData, nbaData, eplData, uclData, cricketData] = await Promise.allSettled([
      sportsApiService.getLiveScores('nfl'),
      sportsApiService.getLiveScores('nba'),
      sportsApiService.getSoccerLeagueScores('eng.1'),
      sportsApiService.getSoccerLeagueScores('uefa.champions'),
      sportsApiService.getCricketMatches()
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
          
          matches.push({
            id: event.id || `${sportName}-${league}-${index}`,
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

    // Helper for cricket matches (CricAPI format)
    const extractCricketMatches = (data) => {
      if (!data || data.status === 'rejected') return [];
      
      const apiData = data.value;
      const cricketMatches = apiData?.matches || [];
      const matches = [];

      cricketMatches.forEach((event, index) => {
        const matchDate = event.dateTimeGMT ? new Date(event.dateTimeGMT) : new Date(event.date);
        const isLive = event.matchStarted && !event.matchEnded;
        const isUpcoming = matchDate >= now && matchDate <= threeDaysLater && !event.matchStarted;
        
        // Format cricket scores
        let homeScore = '-';
        let awayScore = '-';
        if (event.score && event.score.length > 0) {
          const score1 = event.score[0];
          homeScore = `${score1.r}/${score1.w} (${score1.o})`;
          if (event.score.length > 1) {
            const score2 = event.score[1];
            awayScore = `${score2.r}/${score2.w} (${score2.o})`;
          }
        }

        matches.push({
          id: event.id || `cricket-${index}`,
          sport: 'Cricket',
          homeTeam: event.teams?.[0] || 'Team 1',
          awayTeam: event.teams?.[1] || 'Team 2',
          homeScore,
          awayScore,
          status: event.status || 'Scheduled',
          venue: event.venue || 'TBD',
          date: event.dateTimeGMT || event.date,
          league: event.matchType ? event.matchType.toUpperCase() : 'Cricket',
          matchType: event.matchType,
          isLive,
          isUpcoming,
          isFinal: event.matchEnded
        });
      });

      return matches;
    };

    // Extract all matches
    const allMatches = [
      ...extractMatches(nflData, 'NFL'),
      ...extractMatches(nbaData, 'NBA'),
      ...extractMatches(eplData, 'Soccer', 'English Premier League'),
      ...extractMatches(uclData, 'Soccer', 'UEFA Champions League'),
      ...extractCricketMatches(cricketData)
    ];

    // Filter and sort
    const liveGames = allMatches.filter(m => m.isLive);
    const upcomingGames = allMatches
      .filter(m => m.isUpcoming)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`✅ Dashboard data: ${liveGames.length} live, ${upcomingGames.length} upcoming`);

    res.json({
      success: true,
      data: {
        liveGames,
        upcomingGames,
        totalGames: allMatches.length,
        stats: {
          liveCount: liveGames.length,
          upcomingCount: upcomingGames.length,
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
        totalGames: 0
      }
    });
  }
};
