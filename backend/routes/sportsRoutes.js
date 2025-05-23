const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Get available sports
router.get('/sports', async (req, res) => {
  try {
    // This is a placeholder. Replace with actual sports API endpoint
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

// Get upcoming matches for a sport
router.get('/matches/:sportId', async (req, res) => {
  try {
    const { sportId } = req.params;
    const { date } = req.query;

    // This is a placeholder. Replace with actual sports API endpoint
    // Example: const response = await axios.get(`${process.env.SPORTS_API_URL}/matches`, {
    //   params: { sport: sportId, date },
    //   headers: { 'Authorization': `Bearer ${process.env.SPORTS_API_KEY}` }
    // });

    // Placeholder response
    const matches = [
      {
        id: '1',
        title: 'Team A vs Team B',
        sport: sportId,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        teams: {
          home: 'Team A',
          away: 'Team B'
        },
        venue: {
          name: 'Stadium X',
          location: 'City Y'
        }
      }
    ];

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teams for a sport
router.get('/teams/:sportId', async (req, res) => {
  try {
    const { sportId } = req.params;

    // This is a placeholder. Replace with actual sports API endpoint
    const teams = [
      { id: '1', name: 'Team A' },
      { id: '2', name: 'Team B' },
      { id: '3', name: 'Team C' }
    ];

    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get match details
router.get('/matches/:sportId/:matchId', async (req, res) => {
  try {
    const { sportId, matchId } = req.params;

    // This is a placeholder. Replace with actual sports API endpoint
    const match = {
      id: matchId,
      title: 'Team A vs Team B',
      sport: sportId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      teams: {
        home: 'Team A',
        away: 'Team B'
      },
      venue: {
        name: 'Stadium X',
        location: 'City Y'
      },
      status: 'scheduled',
      score: null
    };

    res.json(match);
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 