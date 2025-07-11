const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Get available sports
router.get('/sports', async (req, res) => {
  try {
    // In a production app, you would fetch this from a sports API
    const sports = [
      { id: 'football', name: 'Football' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'cricket', name: 'Cricket' }
    ];
    res.json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teams for a sport
router.get('/teams/:sportId', async (req, res) => {
  try {
    const { sportId } = req.params;
    
    // In a production app, you would fetch this from a sports API
    // For now, we'll use mock data
    let teams = [];
    
    switch(sportId) {
      case 'football':
        teams = [
          { id: 'real_madrid', name: 'Real Madrid' },
          { id: 'barcelona', name: 'FC Barcelona' },
          { id: 'man_utd', name: 'Manchester United' },
          { id: 'liverpool', name: 'Liverpool FC' },
          { id: 'bayern', name: 'Bayern Munich' }
        ];
        break;
      case 'basketball':
        teams = [
          { id: 'lakers', name: 'Los Angeles Lakers' },
          { id: 'celtics', name: 'Boston Celtics' },
          { id: 'warriors', name: 'Golden State Warriors' },
          { id: 'bulls', name: 'Chicago Bulls' }
        ];
        break;
      case 'tennis':
        teams = [
          { id: 'federer', name: 'Roger Federer' },
          { id: 'nadal', name: 'Rafael Nadal' },
          { id: 'djokovic', name: 'Novak Djokovic' },
          { id: 'williams', name: 'Serena Williams' }
        ];
        break;
      case 'cricket':
        teams = [
          { id: 'india', name: 'India' },
          { id: 'australia', name: 'Australia' },
          { id: 'england', name: 'England' },
          { id: 'west_indies', name: 'West Indies' }
        ];
        break;
      default:
        teams = [];
    }
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming matches for a team
router.get('/matches/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // In a production app, you would fetch this from a sports API
    // For now, we'll generate mock data
    const today = new Date();
    const matches = [];
    
    // Generate 5 upcoming matches
    for (let i = 1; i <= 5; i++) {
      const matchDate = new Date(today);
      matchDate.setDate(today.getDate() + i * 3); // Every 3 days
      
      let homeTeam, awayTeam, sportType;
      
      // Determine team names based on teamId
      switch(teamId) {
        case 'real_madrid':
          homeTeam = i % 2 === 0 ? 'Real Madrid' : 'FC Barcelona';
          awayTeam = i % 2 === 0 ? 'FC Barcelona' : 'Real Madrid';
          sportType = 'football';
          break;
        case 'lakers':
          homeTeam = i % 2 === 0 ? 'Los Angeles Lakers' : 'Boston Celtics';
          awayTeam = i % 2 === 0 ? 'Boston Celtics' : 'Los Angeles Lakers';
          sportType = 'basketball';
          break;
        // Add more cases as needed
        default:
          homeTeam = 'Home Team';
          awayTeam = 'Away Team';
          sportType = 'unknown';
      }
      
      // Create match object
      const match = {
        id: `match-${teamId}-${i}`,
        sport: sportType,
        teams: {
          home: homeTeam,
          away: awayTeam
        },
        startTime: new Date(matchDate.setHours(19, 0, 0)).toISOString(),
        endTime: new Date(matchDate.setHours(21, 0, 0)).toISOString(),
        title: `${homeTeam} vs ${awayTeam}`,
        location: `${homeTeam} Stadium`
      };
      
      matches.push(match);
    }
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;