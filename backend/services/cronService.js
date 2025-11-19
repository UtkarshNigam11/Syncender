const cron = require('node-cron');
const User = require('../models/User');
const Event = require('../models/Event');
const { addEventToGoogleCalendar } = require('./googleCalendarService');
const axios = require('axios');

// Auto-sync favorite teams' matches at 12 AM daily
const autoSyncFavoriteTeamsMatches = async () => {
  try {
    console.log('[CRON] Starting auto-sync for favorite teams at', new Date().toISOString());
    
    // Find all users with favorite teams and Google Calendar connected
    const users = await User.find({
      'preferences.favoriteTeams.0': { $exists: true },
      'googleCalendarToken.accessToken': { $exists: true }
    });

    console.log(`[CRON] Found ${users.length} users with favorite teams and Google Calendar`);

    for (const user of users) {
      try {
        await syncUserFavoriteMatches(user);
      } catch (error) {
        console.error(`[CRON] Error syncing matches for user ${user.email}:`, error.message);
      }
    }

    console.log('[CRON] Auto-sync completed');
  } catch (error) {
    console.error('[CRON] Fatal error in auto-sync:', error);
  }
};

// Sync matches for a specific user
const syncUserFavoriteMatches = async (user) => {
  const favoriteTeams = user.preferences?.favoriteTeams || [];
  if (favoriteTeams.length === 0) return;

  console.log(`[CRON] Syncing matches for user ${user.email}, favorites: ${favoriteTeams.join(', ')}`);

  // Fetch all sports matches from all sources
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
  const [nflRes, nbaRes, eplRes, uclRes, cricketRes] = await Promise.all([
    axios
      .get(`${BASE_URL}/api/sports/scores/nfl`)
      .catch(() => ({ data: { data: { events: [] } } })),
    axios
      .get(`${BASE_URL}/api/sports/scores/nba`)
      .catch(() => ({ data: { data: { events: [] } } })),
    axios
      .get(`${BASE_URL}/api/sports/scores/soccer/eng.1`)
      .catch(() => ({ data: { data: { events: [] } } })),
    axios
      .get(`${BASE_URL}/api/sports/scores/soccer/uefa.champions`)
      .catch(() => ({ data: { data: { events: [] } } })),
    axios
      .get(`${BASE_URL}/api/sports/cricket/matches`)
      .catch(() => {
        return { data: { matches: [] } };
      })
  ]);

  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Helper to check if match is within 2 days and matches favorite team
  const isRelevantMatch = (homeTeam, awayTeam, matchDate) => {
    const date = new Date(matchDate);
    const isWithin2Days = date >= now && date <= twoDaysLater;
    const hasFavoriteTeam = favoriteTeams.some(fav => 
      homeTeam.toLowerCase().includes(fav.toLowerCase()) || 
      awayTeam.toLowerCase().includes(fav.toLowerCase()) ||
      fav.toLowerCase().includes(homeTeam.toLowerCase()) ||
      fav.toLowerCase().includes(awayTeam.toLowerCase())
    );
    return isWithin2Days && hasFavoriteTeam;
  };

  const matchesToSync = [];

  // Process ESPN-style events (NFL, NBA, Soccer)
  const processESPNEvents = (events, sportName) => {
    if (!Array.isArray(events)) return;
    events.forEach(event => {
      const competitors = event.competitions?.[0]?.competitors || [];
      const homeTeam = competitors.find(c => c.homeAway === 'home')?.team?.displayName || '';
      const awayTeam = competitors.find(c => c.homeAway === 'away')?.team?.displayName || '';
      const matchDate = event.date;
      const state = event.status?.type?.state;
      
      // Only sync pre-game/scheduled matches
      if ((state === 'pre' || event.status?.type?.name === 'STATUS_SCHEDULED') && 
          isRelevantMatch(homeTeam, awayTeam, matchDate)) {
        matchesToSync.push({
          homeTeam,
          awayTeam,
          sport: sportName,
          venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
          date: matchDate,
          league: event.league?.name || sportName
        });
      }
    });
  };k

  // Process Cricket matches
  const cricketMatches = cricketRes.data?.matches || cricketRes.data?.data || [];
  cricketMatches.forEach(event => {
    const homeTeam = event.strHomeTeam || event.team1 || '';
    const awayTeam = event.strAwayTeam || event.team2 || '';
    const matchDate = event.dateEvent;
    const status = (event.strStatus || event.status || '').toLowerCase();
    const isLive = status.includes('live') || status.includes('in progress');
    
    if (!isLive && matchDate && isRelevantMatch(homeTeam, awayTeam, matchDate)) {
      matchesToSync.push({
        homeTeam,
        awayTeam,
        sport: 'Cricket',
        venue: event.strVenue || 'TBD',
        date: matchDate,
        time: event.strTime,
        league: event.strLeague || 'Cricket'
      });
    }
  });

  processESPNEvents(nflRes.data?.data?.events || [], 'NFL');
  processESPNEvents(nbaRes.data?.data?.events || [], 'NBA');
  processESPNEvents(eplRes.data?.data?.events || [], 'Soccer');
  processESPNEvents(uclRes.data?.data?.events || [], 'Soccer');

  console.log(`[CRON] Found ${matchesToSync.length} relevant matches for user ${user.email}`);

  // Add each match to calendar if not already added
  for (const match of matchesToSync) {
    try {
      // Check if event already exists in database
      const existingEvent = await Event.findOne({
        user: user._id,
        title: { $regex: new RegExp(`${match.awayTeam}.*${match.homeTeam}|${match.homeTeam}.*${match.awayTeam}`, 'i') },
        startTime: { $gte: new Date(match.date), $lt: new Date(new Date(match.date).getTime() + 24 * 60 * 60 * 1000) }
      });

      if (existingEvent) {
        console.log(`[CRON] Match already exists: ${match.awayTeam} vs ${match.homeTeam}`);
        continue;
      }

      // Create event data
      const startTime = new Date(match.date);
      if (match.time) {
        const [hours, minutes] = match.time.split(':');
        startTime.setHours(parseInt(hours) || 19, parseInt(minutes) || 0);
      }
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

      const eventData = {
        user: user._id,
        title: `${match.awayTeam} vs ${match.homeTeam}`,
        description: `${match.sport} match - ${match.league}`,
        location: match.venue,
        startTime,
        endTime,
        sport: match.sport,
        teams: {
          home: match.homeTeam,
          away: match.awayTeam
        },
        source: 'api',
        autoSynced: true
      };

      // Save to database
      const newEvent = await Event.create(eventData);

      // Add to Google Calendar
      if (user.googleCalendarToken?.accessToken) {
        try {
          await addEventToGoogleCalendar(user, eventData);
          console.log(`[CRON] ✓ Added to calendar: ${match.awayTeam} vs ${match.homeTeam}`);
        } catch (gcalError) {
          console.error(`[CRON] Failed to add to Google Calendar:`, gcalError.message);
        }
      }
    } catch (error) {
      console.error(`[CRON] Error adding match ${match.awayTeam} vs ${match.homeTeam}:`, error.message);
    }
  }

  console.log(`[CRON] Completed sync for user ${user.email}`);
};

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('[CRON] Initializing cron jobs...');
  
  // Run every day at 12:00 AM (00:00)
  cron.schedule('0 0 * * *', autoSyncFavoriteTeamsMatches, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('[CRON] Cron job scheduled: Auto-sync favorite teams at 12:00 AM UTC daily');

  // Optional: Run immediately on server start for testing
  // Uncomment the line below if you want to test immediately
  // setTimeout(autoSyncFavoriteTeamsMatches, 5000);
};

module.exports = {
  initializeCronJobs,
  autoSyncFavoriteTeamsMatches,
  syncUserFavoriteMatches
};
