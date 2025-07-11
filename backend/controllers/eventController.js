const { google } = require('googleapis');
const oauth2Client = require('../config/google');
const Event = require('../models/Event');
const User = require('../models/User');

const calendar = google.calendar({ version: 'v3' });

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, sport, teams, location } = req.body;
    
    // Create event in database
    const newEvent = new Event({
      title,
      description,
      startTime,
      endTime,
      sport,
      teams,
      location,
      user: req.user.userId,
      source: 'manual'
    });
    
    await newEvent.save();
    
    res.status(201).json({
      success: true,
      data: newEvent
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
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add event to Google Calendar
exports.addToGoogleCalendar = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get user's Google Calendar token
    const user = await User.findById(req.user.userId);
    if (!user.googleCalendarToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Set auth credentials
    oauth2Client.setCredentials({
      access_token: user.googleCalendarToken.accessToken,
      refresh_token: user.googleCalendarToken.refreshToken,
      expiry_date: user.googleCalendarToken.expiryDate
    });
    
    // Create Google Calendar event
    const googleEvent = {
      summary: event.title,
      description: `${event.description || ''} - ${event.teams.home} vs ${event.teams.away}`,
      start: {
        dateTime: event.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'UTC',
      },
      location: event.location
    };

    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    // Update event with Google Calendar ID
    event.googleCalendarEventId = response.data.id;
    await event.save();

    res.status(200).json({ 
      success: true, 
      message: 'Event added to Google Calendar',
      eventId: response.data.id 
    });
  } catch (error) {
    console.error('Google Calendar API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to add event to Google Calendar' });
  }
};
