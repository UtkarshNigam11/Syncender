const Event = require('../models/Event');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const googleCalendarService = require('../services/googleCalendarService');

// Create a new event
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, startTime, endTime, sport, teams, location } = req.body;
    
    // Check if event already exists for this user
    const existingEvent = await Event.findOne({
      user: req.user.userId,
      title: title,
      startTime: new Date(startTime),
      $or: [
        { 'teams.home': teams?.home, 'teams.away': teams?.away },
        { 'teams.home': teams?.away, 'teams.away': teams?.home } // Check both orders
      ]
    });

    if (existingEvent) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        data: existingEvent,
        message: 'Event already exists in your calendar'
      });
    }
    
    // Create event in database
    const newEvent = new Event({
      title,
      description,
      startTime,
      endTime,
      sport,
      teams,
      location: location, // Explicitly set location
      user: req.user.userId,
      source: 'manual'
    });
    
    await newEvent.save();

    // Try to add to Google Calendar if user has connected it
    const user = await User.findById(req.user.userId);
    if (user && user.googleCalendarToken && user.googleCalendarToken.accessToken) {
      try {
        const googleEventId = await googleCalendarService.createGoogleCalendarEvent(user, newEvent);
        newEvent.externalIds = { googleCalendar: googleEventId };
        // Also set legacy field for backwards compatibility
        newEvent.googleCalendarEventId = googleEventId;
        await newEvent.save();
      } catch (error) {
        console.error('Error adding to Google Calendar:', error);
        // Continue without Google Calendar integration if it fails
        // Don't throw error to ensure event is still saved locally
      }
    } else {
      console.log('User has not connected Google Calendar or token is missing');
    }
    
    res.status(201).json({
      success: true,
      data: newEvent,
      message: user && user.googleCalendarToken ? 
        'Event created and added to Google Calendar' : 
        'Event created locally. Connect Google Calendar in your profile to sync events.'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all events for a user
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.userId })
      .sort({ startTime: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if specific events exist (for batch checking)
exports.checkEventsExist = async (req, res) => {
  try {
    const { matches } = req.body; // Array of {homeTeam, awayTeam, startTime}
    
    if (!Array.isArray(matches)) {
      return res.status(400).json({ message: 'matches must be an array' });
    }

    const existingEvents = {};
    
    for (const match of matches) {
      const { homeTeam, awayTeam, startTime } = match;
      
      // Create a unique key for this match
      const matchKey = `${awayTeam}-${homeTeam}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if event exists
      const event = await Event.findOne({
        user: req.user.userId,
        $or: [
          { 'teams.home': homeTeam, 'teams.away': awayTeam },
          { 'teams.home': awayTeam, 'teams.away': homeTeam }
        ],
        startTime: new Date(startTime)
      });
      
      existingEvents[matchKey] = !!event;
    }
    
    res.json({ success: true, existingEvents });
  } catch (error) {
    console.error('Error checking events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sync events with Google Calendar (two-way sync)
exports.syncWithGoogleCalendar = async (req, res) => {
  console.log('\n🔄 ===== SYNC STARTED =====');
  console.log(`👤 User ID: ${req.user.userId}`);
  
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.googleCalendarToken || !user.googleCalendarToken.accessToken) {
      console.log('❌ Google Calendar not connected');
      return res.status(400).json({ 
        success: false,
        message: 'Google Calendar not connected' 
      });
    }
    
    console.log('✅ User authenticated and has Google Calendar token');

    // Get all our events for this user that have Google Calendar IDs
    const localEvents = await Event.find({ user: req.user.userId });
    
    console.log(`📊 Found ${localEvents.length} local events for sync check`);

    // Get events from Google Calendar (last 30 days to next 90 days)
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90);

    let googleEvents;
    try {
      googleEvents = await googleCalendarService.listGoogleCalendarEvents(user, timeMin, timeMax);
      console.log(`📊 Found ${googleEvents.length} events in Google Calendar`);
      
      // Log the first few Google Calendar event IDs for debugging
      if (googleEvents.length > 0) {
        console.log(`📋 Sample Google Calendar event IDs:`);
        googleEvents.slice(0, 5).forEach(event => {
          console.log(`   - ${event.id}: "${event.summary || 'No title'}"`);
        });
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }

    // Create a map of Google event IDs for quick lookup
    const googleEventIds = new Set(googleEvents.map(e => e.id));
    console.log(`📊 Google Calendar Event IDs:`, Array.from(googleEventIds).slice(0, 5)); // Log first 5

    // Check which local events were deleted from Google Calendar
    const deletedEvents = [];
    for (const localEvent of localEvents) {
      // Check both the new externalIds field and legacy googleCalendarEventId field
      const googleEventId = localEvent.externalIds?.googleCalendar || localEvent.googleCalendarEventId;
      
      if (googleEventId) {
        console.log(`🔍 Checking event "${localEvent.title}" with Google ID: ${googleEventId}`);
        
        // Check if event still exists in Google Calendar
        if (!googleEventIds.has(googleEventId)) {
          console.log(`🗑️ Event "${localEvent.title}" was deleted from Google Calendar, removing locally...`);
          // Event was deleted from Google Calendar, delete it locally
          await Event.findByIdAndDelete(localEvent._id);
          deletedEvents.push({
            id: localEvent._id,
            title: localEvent.title
          });
        } else {
          console.log(`✅ Event "${localEvent.title}" still exists in Google Calendar`);
        }
      }
    }

    console.log(`📊 Sync Summary: ${deletedEvents.length} events deleted locally`);

    // Get updated list of events after deletion sync
    const updatedEvents = await Event.find({ user: req.user.userId })
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: updatedEvents,
      syncInfo: {
        totalLocalEvents: updatedEvents.length,
        deletedFromLocal: deletedEvents.length,
        deletedEvents: deletedEvents,
        lastSyncTime: new Date()
      }
    });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during sync',
      error: error.message 
    });
  }
};

// Get a specific event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event
    Object.assign(event, req.body);
    await event.save();

    // Update in Google Calendar if connected
    const user = await User.findById(req.user.userId);
    const googleEventId = event.externalIds?.googleCalendar || event.googleCalendarEventId;
    if (user && user.googleCalendarToken && googleEventId) {
      try {
        await googleCalendarService.updateGoogleCalendarEvent(
          user, 
          googleEventId, 
          event
        );
      } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        // Continue without Google Calendar update
      }
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete from Google Calendar if connected
    const user = await User.findById(req.user.userId);
    const googleEventId = event.externalIds?.googleCalendar || event.googleCalendarEventId;
    if (user && user.googleCalendarToken && googleEventId) {
      try {
        await googleCalendarService.deleteGoogleCalendarEvent(
          user, 
          googleEventId
        );
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        // Continue with local deletion
      }
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add existing event to Google Calendar
exports.addToGoogleCalendar = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event details
    const event = await Event.findOne({ 
      _id: eventId, 
      user: req.user.userId 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.externalIds?.googleCalendar || event.googleCalendarEventId) {
      return res.status(400).json({ message: 'Event already added to Google Calendar' });
    }
    
    // Get user's Google Calendar token
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleCalendarToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Add to Google Calendar
    const googleEventId = await googleCalendarService.createGoogleCalendarEvent(user, event);
    
    // Update event with Google Calendar ID
    event.externalIds = { ...event.externalIds, googleCalendar: googleEventId };
    event.googleCalendarEventId = googleEventId; // Legacy field
    await event.save();

    res.status(200).json({ 
      success: true, 
      message: 'Event added to Google Calendar',
      googleEventId 
    });
  } catch (error) {
    console.error('Google Calendar API Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add event to Google Calendar',
      error: error.message 
    });
  }
};
