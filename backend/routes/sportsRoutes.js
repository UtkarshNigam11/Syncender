const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const sportsController = require('../controllers/sportsController');

// Auth middleware removed: all sports routes are now public

// Get supported sports
router.get('/sports', sportsController.getSports);

// ESPN API routes - Live scores, teams, standings
router.get('/scores/:sport', sportsController.getLiveScores);
router.get('/teams/:sport', sportsController.getTeams);
router.get('/standings/:sport', sportsController.getStandings);

// SportsDB API routes - Detailed information
router.get('/leagues', sportsController.getLeagues);
router.get('/league/:leagueId/fixtures', sportsController.getLeagueFixtures);
router.get('/team/:teamName/details', sportsController.getTeamDetails);
router.get('/player/:playerName/search', sportsController.searchPlayer);

// Cricket specific route
router.get('/cricket/matches', sportsController.getCricketMatches);

// Create event from sports data
router.post('/create-event', sportsController.createEventFromSportsData);

module.exports = router;