const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const sportsController = require('../controllers/sportsController');

// Auth middleware removed: all sports routes are now public

// Get supported sports
router.get('/sports', sportsController.getSports);

// Unified dashboard data endpoint
router.get('/dashboard', sportsController.getDashboardData);

// ESPN API routes - Live scores, teams, standings
router.get('/scores/:sport', sportsController.getLiveScores);
// League-specific soccer scores (e.g., /scores/soccer/eng.1, /scores/soccer/uefa.champions)
router.get('/scores/soccer/:league', sportsController.getSoccerLeagueScores);

// Specific team fetching routes (MUST come before generic route)
router.get('/teams/soccer', sportsController.getSoccerTeams); // Query param: ?league=eng.1
router.get('/teams/cricket', sportsController.getCricketTeams); // Query param: ?league=ipl
router.get('/teams/nfl', sportsController.getNFLTeams);
router.get('/teams/nba', sportsController.getNBATeams);

// Generic teams route (catches all other sports)
router.get('/teams/:sport', sportsController.getTeams);
router.get('/standings/:sport', sportsController.getStandings);

// SportsDB API routes - Detailed information
router.get('/leagues', sportsController.getLeagues);
router.get('/league/:leagueId/fixtures', sportsController.getLeagueFixtures);
router.get('/team/:teamName/details', sportsController.getTeamDetails);
router.get('/player/:playerName/search', sportsController.searchPlayer);

// Cricket specific routes
router.get('/cricket/matches', sportsController.getCricketMatches);
router.post('/cricket/sync', sportsController.syncCricketMatches); // Admin: Force sync
router.delete('/cricket/cleanup', sportsController.cleanupCricketMatches); // Admin: Cleanup old
router.get('/cricket/stats', sportsController.getCricketCacheStats); // Admin: Cache stats

// Create event from sports data
router.post('/create-event', sportsController.createEventFromSportsData);

module.exports = router;