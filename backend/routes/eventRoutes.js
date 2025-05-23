const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const { google } = require('googleapis');
const { createOAuthClient } = require('../config/google');
const User = require('../models/User');

// Apply auth middleware to all routes
router.use(protect);

// Helper function to create Google Calendar event
async function createGoogleCalendarEvent(user, eventData) {
  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const googleEvent = {
    summary: eventData.title,
    description: `${eventData.sport} match: ${eventData.teams.home} vs ${eventData.teams.away}\n${eventData.description || ''}`,
    start: {
      dateTime: eventData.startTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    location: eventData.venue?.location,
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: googleEvent,
  });

  return response.data.id;
}

// Helper function to update Google Calendar event
async function updateGoogleCalendarEvent(user, googleEventId, eventData) {
  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const googleEvent = {
    summary: eventData.title,
    description: `${eventData.sport} match: ${eventData.teams.home} vs ${eventData.teams.away}\n${eventData.description || ''}`,
    start: {
      dateTime: eventData.startTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    location: eventData.venue?.location,
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: googleEvent,
  });
}

// Helper function to delete Google Calendar event
async function deleteGoogleCalendarEvent(user, googleEventId) {
  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
}

// Test Google Calendar access
router.get('/test-google-calendar', async (req, res) => {
  try {
    // Get user with Google Calendar tokens
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleCalendarToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected for this user'
      });
    }

    // Create OAuth client with user's tokens
    const oauth2Client = createOAuthClient(
      user.googleCalendarToken.accessToken,
      user.googleCalendarToken.refreshToken
    );

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Try to list calendars
    const { data } = await calendar.calendarList.list();
    
    res.json({
      success: true,
      message: 'Successfully connected to Google Calendar',
      calendars: data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary
      }))
    });
  } catch (error) {
    console.error('Google Calendar test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access Google Calendar',
      error: error.message
    });
  }
});

// Middleware to validate event data
const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('sport').notEmpty().withMessage('Sport type is required'),
  body('teams.home').notEmpty().withMessage('Home team is required'),
  body('teams.away').notEmpty().withMessage('Away team is required')
];

// Get all events for a user
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.userId })
      .sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new event
router.post('/', validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get user with Google Calendar tokens
    const user = await User.findById(req.user.userId);
    if (!user || !user.googleCalendarToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected for this user'
      });
    }

    const eventData = {
      ...req.body,
      user: req.user.userId,
      source: 'manual'
    };

    // Create event in Google Calendar
    let googleEventId;
    try {
      googleEventId = await createGoogleCalendarEvent(user, eventData);
      eventData.externalIds = { googleCalendar: googleEventId };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      // Continue with local event creation even if Google Calendar fails
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create event',
      error: error.message 
    });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
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
});

// Update event
router.put('/:id', validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get user and event
    const user = await User.findById(req.user.userId);
    const event = await Event.findOne({ _id: req.params.id, user: req.user.userId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user || !user.googleCalendarToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected for this user'
      });
    }

    // Update in Google Calendar if it exists
    if (event.externalIds?.googleCalendar) {
      try {
        await updateGoogleCalendarEvent(user, event.externalIds.googleCalendar, req.body);
      } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        // Continue with local update even if Google Calendar fails
      }
    }

    // Update local event
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update event',
      error: error.message 
    });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    // Get user and event
    const user = await User.findById(req.user.userId);
    const event = await Event.findOne({ _id: req.params.id, user: req.user.userId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (user?.googleCalendarToken && event.externalIds?.googleCalendar) {
      try {
        await deleteGoogleCalendarEvent(user, event.externalIds.googleCalendar);
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        // Continue with local deletion even if Google Calendar fails
      }
    }

    await Event.findOneAndDelete({ _id: req.params.id, user: req.user.userId });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete event',
      error: error.message 
    });
  }
});

module.exports = router;
