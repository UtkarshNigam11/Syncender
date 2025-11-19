const User = require('../models/User');
const Event = require('../models/Event');
const CricketMatch = require('../models/CricketMatch');
const axios = require('axios');

/**
 * Auto-sync service for favorite teams
 * Batch syncs all teams added within 1 minute window
 */

// Store pending sync timers for each user
const pendingSyncs = new Map();

// Base URL for internal API calls
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Trigger auto-sync for a specific user (debounced - batches multiple teams)
 * If multiple teams are added within 1 minute, they'll all be synced together
 */
exports.scheduleAutoSyncForUser = async (userId) => {
  // Clear existing timer if one exists (batching)
  if (pendingSyncs.has(userId)) {
    clearTimeout(pendingSyncs.get(userId));
  }
  
  // Schedule new sync after 1 minute
  const timerId = setTimeout(async () => {
    try {
      console.log(`\n🚀 Auto-sync executing for user ${userId.toString().substring(0, 8)}...`);
      await this.syncAllFavoriteTeams(userId);
      pendingSyncs.delete(userId);
      console.log(`✅ Auto-sync completed\n`);
    } catch (error) {
      console.error(`❌ Auto-sync failed:`, error.message);
      pendingSyncs.delete(userId);
    }
  }, 1 * 60 * 1000); // 1 minute in milliseconds
  
  pendingSyncs.set(userId, timerId);
  
  return {
    success: true,
    message: 'Auto-sync scheduled in 1 minute (will batch with any other teams added)'
  };
};

/**
 * Sync all matches for a specific team
 */
exports.syncTeamMatches = async (userId, teamData) => {
  try {
    console.log(`🔄 Auto-syncing ${teamData.name} (${teamData.sport})`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return { success: false, message: 'User not found' };
    }

    // ✅ CHECK: Verify team still exists in user's favorites
    const favoriteTeams = user.preferences?.favoriteTeams || [];
    const teamStillExists = favoriteTeams.some(
      t => t.sport === teamData.sport && t.teamId === teamData.teamId && t.name === teamData.name
    );
    
    if (!teamStillExists) {
      console.log(`   ⏭️  Team "${teamData.name}" was removed from favorites - skipping sync`);
      return { 
        success: true, 
        message: 'Team removed from favorites',
        synced: 0,
        skipped: true
      };
    }

    // Check if user has Google Calendar connected
    if (!user.googleCalendarToken?.accessToken) {
      console.log(`⚠️  Google Calendar not connected - matches saved to DB only`);
      console.log(`   → Connect calendar at: Settings > Connect Google Calendar`);
      return { 
        success: false, 
        message: 'Google Calendar not connected',
        requiresCalendar: true 
      };
    }

    let matchesToSync = [];

    // Fetch matches based on sport type
    const sportLower = teamData.sport.toLowerCase();
    
    switch (sportLower) {
      case 'cricket':
        matchesToSync = await this.getCricketMatches(teamData);
        break;
      case 'nfl':
      case 'american football':
        matchesToSync = await this.getNFLMatches(teamData);
        break;
      case 'nba':
      case 'basketball':
        matchesToSync = await this.getNBAMatches(teamData);
        break;
      case 'soccer':
      case 'football':
        matchesToSync = await this.getSoccerMatches(teamData);
        break;
      default:
        console.log(`⚠️  Sport "${teamData.sport}" not supported for auto-sync`);
        return { success: false, message: 'Sport not supported' };
    }

    if (matchesToSync.length === 0) {
      console.log(`   ℹ️  No upcoming matches found for ${teamData.name}`);
      return { 
        success: true, 
        message: 'No upcoming matches found',
        synced: 0 
      };
    }
    
    console.log(`   📊 Found ${matchesToSync.length} match(es) to sync`);

    // Add matches to calendar
    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const match of matchesToSync) {
      try {
        // Check if event already exists
        const existingEvent = await Event.findOne({
          user: user._id,
          title: { 
            $regex: new RegExp(
              `${this.escapeRegex(match.awayTeam)}.*${this.escapeRegex(match.homeTeam)}|${this.escapeRegex(match.homeTeam)}.*${this.escapeRegex(match.awayTeam)}`, 
              'i'
            ) 
          },
          startTime: { 
            $gte: new Date(match.date), 
            $lt: new Date(new Date(match.date).getTime() + 24 * 60 * 60 * 1000) 
          }
        });

        if (existingEvent) {
          console.log(`   ⏭️  Already added: ${match.awayTeam} vs ${match.homeTeam}`);
          skipped++;
          continue;
        }

        // Create event data
        const startTime = new Date(match.date);
        if (match.time) {
          const [hours, minutes] = match.time.split(':');
          startTime.setHours(parseInt(hours) || 19, parseInt(minutes) || 0);
        }
        const endTime = new Date(startTime.getTime() + (match.duration || 3) * 60 * 60 * 1000);

        const eventData = {
          user: user._id,
          title: `${match.awayTeam} vs ${match.homeTeam}`,
          description: `${match.sport} match - ${match.league}\n\nAuto-synced from your favorite team: ${teamData.name}`,
          location: match.venue || 'TBD',
          startTime,
          endTime,
          sport: match.sport,
          teams: {
            home: match.homeTeam,
            away: match.awayTeam
          },
          source: 'api',
          autoSynced: true,
          syncedFromFavorite: teamData.name
        };

        // Save to database
        const newEvent = await Event.create(eventData);

        // Add to Google Calendar and save the event ID
        try {
          const { createGoogleCalendarEvent } = require('./googleCalendarService');
          const googleEventId = await createGoogleCalendarEvent(user, newEvent);
          
          // Save Google Calendar ID to database
          newEvent.externalIds = { googleCalendar: googleEventId };
          newEvent.googleCalendarEventId = googleEventId;
          await newEvent.save();
          
          console.log(`   ✅ Synced: ${match.awayTeam} vs ${match.homeTeam}`);
          synced++;
        } catch (gcalError) {
          console.error(`   ⚠️  Calendar sync failed: ${gcalError.message}`);
          synced++; // Still count as synced to DB
        }
      } catch (error) {
        console.error(`   ❌ Error: ${match.awayTeam} vs ${match.homeTeam} - ${error.message}`);
        errors++;
      }
    }

    if (synced > 0 || errors > 0) {
      console.log(`   ✅ ${teamData.name}: ${synced} synced, ${skipped} skipped, ${errors} errors`);
    }

    return {
      success: true,
      synced,
      skipped,
      errors,
      total: matchesToSync.length
    };
  } catch (error) {
    console.error('❌ Error in syncTeamMatches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get Cricket matches for a team from cache/DB
 */
exports.getCricketMatches = async (teamData) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Search in cached cricket matches
    const matches = await CricketMatch.find({
      $or: [
        { 'teamInfo.name': { $regex: new RegExp(teamData.name, 'i') } },
        { 'teamInfo.shortname': { $regex: new RegExp(teamData.shortName || teamData.name, 'i') } },
        { teams: { $regex: new RegExp(teamData.name, 'i') } }
      ],
      dateTimeGMT: { $gte: now, $lte: thirtyDaysLater },
      matchEnded: false
    }).sort({ dateTimeGMT: 1 }).limit(20);

    return matches.map(match => ({
      homeTeam: match.teamInfo?.[0]?.name || match.teams?.[0] || 'TBD',
      awayTeam: match.teamInfo?.[1]?.name || match.teams?.[1] || 'TBD',
      sport: 'Cricket',
      league: match.matchType || 'Cricket',
      venue: match.venue || 'TBD',
      date: match.dateTimeGMT,
      time: match.dateTimeGMT ? new Date(match.dateTimeGMT).toTimeString().substring(0, 5) : null,
      duration: 5 // Cricket matches typically 5+ hours
    }));
  } catch (error) {
    console.error('Error fetching cricket matches:', error);
    return [];
  }
};

/**
 * Get NFL matches for a team from ESPN API
 */
exports.getNFLMatches = async (teamData) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/sports/scores/nfl`);
    const events = response.data?.data?.events || [];

    return this.filterESPNMatches(events, teamData, 'NFL', 3);
  } catch (error) {
    console.error('Error fetching NFL matches:', error);
    return [];
  }
};

/**
 * Get NBA matches for a team from ESPN API
 */
exports.getNBAMatches = async (teamData) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/sports/scores/nba`);
    const events = response.data?.data?.events || [];

    return this.filterESPNMatches(events, teamData, 'NBA', 2.5);
  } catch (error) {
    console.error('Error fetching NBA matches:', error);
    return [];
  }
};

/**
 * Get Soccer matches for a team from ESPN API
 */
exports.getSoccerMatches = async (teamData) => {
  try {
    // Fetch from multiple leagues
    const [eplRes, uclRes, laLigaRes] = await Promise.allSettled([
      axios.get(`${BASE_URL}/api/sports/scores/soccer/eng.1`),
      axios.get(`${BASE_URL}/api/sports/scores/soccer/uefa.champions`),
      axios.get(`${BASE_URL}/api/sports/scores/soccer/esp.1`)
    ]);

    const allEvents = [];
    
    if (eplRes.status === 'fulfilled') {
      allEvents.push(...(eplRes.value.data?.data?.events || []));
    }
    if (uclRes.status === 'fulfilled') {
      allEvents.push(...(uclRes.value.data?.data?.events || []));
    }
    if (laLigaRes.status === 'fulfilled') {
      allEvents.push(...(laLigaRes.value.data?.data?.events || []));
    }

    return this.filterESPNMatches(allEvents, teamData, 'Soccer', 2);
  } catch (error) {
    console.error('Error fetching soccer matches:', error);
    return [];
  }
};

/**
 * Helper: Filter ESPN-style matches for a specific team
 */
exports.filterESPNMatches = (events, teamData, sportName, duration = 3) => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const matches = [];

  for (const event of events) {
    const competitors = event.competitions?.[0]?.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home')?.team?.displayName || '';
    const awayTeam = competitors.find(c => c.homeAway === 'away')?.team?.displayName || '';
    const matchDate = new Date(event.date);
    const state = event.status?.type?.state;

    // Check if match is upcoming and within 30 days
    if ((state === 'pre' || event.status?.type?.name === 'STATUS_SCHEDULED') && 
        matchDate >= now && 
        matchDate <= thirtyDaysLater) {
      
      // Check if this match involves the favorite team
      const isTeamMatch = this.isTeamMatch(homeTeam, awayTeam, teamData);
      
      if (isTeamMatch) {
        matches.push({
          homeTeam,
          awayTeam,
          sport: sportName,
          league: event.league?.name || teamData.league || sportName,
          venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
          date: matchDate,
          time: matchDate.toTimeString().substring(0, 5),
          duration
        });
      }
    }
  }

  return matches;
};

/**
 * Helper: Check if a match involves the favorite team
 */
exports.isTeamMatch = (homeTeam, awayTeam, teamData) => {
  const teamName = teamData.name.toLowerCase();
  const shortName = (teamData.shortName || teamData.name).toLowerCase();
  const homeTeamLower = homeTeam.toLowerCase();
  const awayTeamLower = awayTeam.toLowerCase();

  return (
    homeTeamLower.includes(teamName) ||
    awayTeamLower.includes(teamName) ||
    homeTeamLower.includes(shortName) ||
    awayTeamLower.includes(shortName) ||
    teamName.includes(homeTeamLower) ||
    teamName.includes(awayTeamLower) ||
    shortName.includes(homeTeamLower) ||
    shortName.includes(awayTeamLower)
  );
};

/**
 * Sync all matches for a specific league (PRO feature)
 */
exports.syncLeagueMatches = async (userId, leagueData) => {
  try {
    console.log(`🔄 Auto-syncing ${leagueData.name} league`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return { success: false, message: 'User not found' };
    }

    // ✅ CHECK: Verify league still exists in user's favorites
    const favoriteLeagues = user.preferences?.favoriteLeagues || [];
    const leagueStillExists = favoriteLeagues.some(
      l => l.sport === leagueData.sport && l.league === leagueData.league && l.name === leagueData.name
    );
    
    if (!leagueStillExists) {
      console.log(`   ⏭️  League "${leagueData.name}" was removed from favorites - skipping sync`);
      return { 
        success: true, 
        message: 'League removed from favorites',
        synced: 0,
        skipped: true
      };
    }

    // Check if user has Google Calendar connected
    if (!user.googleCalendarToken?.accessToken) {
      console.log(`⚠️  Google Calendar not connected - matches saved to DB only`);
      console.log(`   → Connect calendar at: Settings > Connect Google Calendar`);
      return { 
        success: false, 
        message: 'Google Calendar not connected',
        requiresCalendar: true 
      };
    }

    let matchesToSync = [];

    // Fetch ALL matches from the league based on sport type
    const sportLower = leagueData.sport.toLowerCase();
    
    switch (sportLower) {
      case 'soccer':
      case 'football':
        matchesToSync = await this.getAllSoccerLeagueMatches(leagueData);
        break;
      case 'nfl':
      case 'american football':
        matchesToSync = await this.getAllNFLMatches();
        break;
      case 'nba':
      case 'basketball':
        matchesToSync = await this.getAllNBAMatches();
        break;
      case 'cricket':
        matchesToSync = await this.getAllCricketMatches();
        break;
      default:
        console.log(`⚠️  Sport "${leagueData.sport}" not supported for league sync`);
        return { success: false, message: 'Sport not supported' };
    }

    if (matchesToSync.length === 0) {
      console.log(`   ℹ️  No upcoming matches found for ${leagueData.name}`);
      return { 
        success: true, 
        message: 'No upcoming matches found',
        synced: 0 
      };
    }
    
    console.log(`   📊 Found ${matchesToSync.length} match(es) to sync`);

    // Add matches to calendar
    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const match of matchesToSync) {
      try {
        // Check if event already exists
        const existingEvent = await Event.findOne({
          user: user._id,
          title: { 
            $regex: new RegExp(
              `${this.escapeRegex(match.awayTeam)}.*${this.escapeRegex(match.homeTeam)}|${this.escapeRegex(match.homeTeam)}.*${this.escapeRegex(match.awayTeam)}`, 
              'i'
            ) 
          },
          startTime: { 
            $gte: new Date(match.date), 
            $lt: new Date(new Date(match.date).getTime() + 24 * 60 * 60 * 1000) 
          }
        });

        if (existingEvent) {
          skipped++;
          continue;
        }

        // Create event data
        const startTime = new Date(match.date);
        if (match.time) {
          const [hours, minutes] = match.time.split(':');
          startTime.setHours(parseInt(hours) || 19, parseInt(minutes) || 0);
        }
        const endTime = new Date(startTime.getTime() + (match.duration || 3) * 60 * 60 * 1000);

        const eventData = {
          user: user._id,
          title: `${match.awayTeam} vs ${match.homeTeam}`,
          description: `${match.sport} match - ${match.league}\n\nAuto-synced from your favorite league: ${leagueData.name}`,
          location: match.venue || 'TBD',
          startTime,
          endTime,
          sport: match.sport,
          teams: {
            home: match.homeTeam,
            away: match.awayTeam
          },
          source: 'api',
          autoSynced: true,
          syncedFromLeague: leagueData.name
        };

        // Save to database
        const newEvent = await Event.create(eventData);

        // Add to Google Calendar and save the event ID
        try {
          const { createGoogleCalendarEvent } = require('./googleCalendarService');
          const googleEventId = await createGoogleCalendarEvent(user, newEvent);
          
          // Save Google Calendar ID to database
          newEvent.externalIds = { googleCalendar: googleEventId };
          newEvent.googleCalendarEventId = googleEventId;
          await newEvent.save();
          
          synced++;
        } catch (gcalError) {
          console.error(`   ⚠️  Calendar sync failed: ${gcalError.message}`);
          synced++; // Still count as synced to DB
        }
      } catch (error) {
        console.error(`   ❌ Error: ${match.awayTeam} vs ${match.homeTeam} - ${error.message}`);
        errors++;
      }
    }

    if (synced > 0 || errors > 0) {
      console.log(`   ✅ ${leagueData.name}: ${synced} synced, ${skipped} skipped, ${errors} errors`);
    }

    return {
      success: true,
      synced,
      skipped,
      errors,
      total: matchesToSync.length
    };
  } catch (error) {
    console.error('❌ Error in syncLeagueMatches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get ALL matches from a soccer league (no team filtering)
 */
exports.getAllSoccerLeagueMatches = async (leagueData) => {
  try {
    // Map league names/codes to ESPN league IDs
    const leagueMap = {
      'eng.1': 'eng.1',
      'epl': 'eng.1',
      'premier league': 'eng.1',
      'uefa.champions': 'uefa.champions',
      'ucl': 'uefa.champions',
      'champions league': 'uefa.champions',
      'esp.1': 'esp.1',
      'la liga': 'esp.1',
      'laliga': 'esp.1'
    };

    const leagueCode = leagueMap[leagueData.league.toLowerCase()] || leagueData.league;
    
    const response = await axios.get(`${BASE_URL}/api/sports/scores/soccer/${leagueCode}`);
    const events = response.data?.data?.events || [];

    return this.filterESPNMatchesForLeague(events, leagueData.name, 'Soccer', 2);
  } catch (error) {
    console.error('Error fetching soccer league matches:', error);
    return [];
  }
};

/**
 * Get ALL NFL matches (entire league)
 */
exports.getAllNFLMatches = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/sports/scores/nfl`);
    const events = response.data?.data?.events || [];
    return this.filterESPNMatchesForLeague(events, 'NFL', 'NFL', 3);
  } catch (error) {
    console.error('Error fetching NFL matches:', error);
    return [];
  }
};

/**
 * Get ALL NBA matches (entire league)
 */
exports.getAllNBAMatches = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/sports/scores/nba`);
    const events = response.data?.data?.events || [];
    return this.filterESPNMatchesForLeague(events, 'NBA', 'NBA', 2.5);
  } catch (error) {
    console.error('Error fetching NBA matches:', error);
    return [];
  }
};

/**
 * Get ALL cricket matches from cache (entire cricket)
 */
exports.getAllCricketMatches = async () => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const matches = await CricketMatch.find({
      dateTimeGMT: { $gte: now, $lte: thirtyDaysLater },
      matchEnded: false
    }).sort({ dateTimeGMT: 1 }).limit(50); // Limit to 50 matches for leagues

    return matches.map(match => ({
      homeTeam: match.teamInfo?.[0]?.name || match.teams?.[0] || 'TBD',
      awayTeam: match.teamInfo?.[1]?.name || match.teams?.[1] || 'TBD',
      sport: 'Cricket',
      league: match.matchType || 'Cricket',
      venue: match.venue || 'TBD',
      date: match.dateTimeGMT,
      time: match.dateTimeGMT ? new Date(match.dateTimeGMT).toTimeString().substring(0, 5) : null,
      duration: 5
    }));
  } catch (error) {
    console.error('Error fetching cricket matches:', error);
    return [];
  }
};

/**
 * Helper: Filter ESPN-style matches for entire league (no team filtering)
 */
exports.filterESPNMatchesForLeague = (events, leagueName, sportName, duration = 3) => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const matches = [];

  for (const event of events) {
    const competitors = event.competitions?.[0]?.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home')?.team?.displayName || '';
    const awayTeam = competitors.find(c => c.homeAway === 'away')?.team?.displayName || '';
    const matchDate = new Date(event.date);
    const state = event.status?.type?.state;

    // Check if match is upcoming and within 30 days
    if ((state === 'pre' || event.status?.type?.name === 'STATUS_SCHEDULED') && 
        matchDate >= now && 
        matchDate <= thirtyDaysLater) {
      
      matches.push({
        homeTeam,
        awayTeam,
        sport: sportName,
        league: leagueName,
        venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
        date: matchDate,
        time: matchDate.toTimeString().substring(0, 5),
        duration
      });
    }
  }

  return matches;
};

/**
 * Helper: Escape special regex characters
 */
exports.escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sync matches for ALL favorite teams AND leagues of a user
 * Useful for bulk operations or when user connects calendar
 */
exports.syncAllFavoriteTeams = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const favoriteTeams = user.preferences?.favoriteTeams || [];
    const favoriteLeagues = user.preferences?.favoriteLeagues || [];
    
    if (favoriteTeams.length === 0 && favoriteLeagues.length === 0) {
      console.log('   ℹ️  No favorites to sync');
      return { success: true, message: 'No favorites', synced: 0 };
    }

    console.log(`   Syncing ${favoriteTeams.length} team(s) + ${favoriteLeagues.length} league(s)...`);
    let totalSynced = 0;
    let totalErrors = 0;

    // Sync favorite teams
    for (const team of favoriteTeams) {
      try {
        const result = await this.syncTeamMatches(userId, team);
        totalSynced += result.synced || 0;
        totalErrors += result.errors || 0;
      } catch (error) {
        console.error(`   ❌ ${team.name}: ${error.message}`);
        totalErrors++;
      }
    }

    // Sync favorite leagues (PRO feature)
    for (const league of favoriteLeagues) {
      try {
        const result = await this.syncLeagueMatches(userId, league);
        totalSynced += result.synced || 0;
        totalErrors += result.errors || 0;
      } catch (error) {
        console.error(`   ❌ ${league.name}: ${error.message}`);
        totalErrors++;
      }
    }

    return {
      success: true,
      synced: totalSynced,
      errors: totalErrors,
      teamsProcessed: favoriteTeams.length
    };
  } catch (error) {
    console.error('❌ Error in syncAllFavoriteTeams:', error);
    return { success: false, error: error.message };
  }
};

module.exports = exports;
