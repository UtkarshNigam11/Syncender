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

    // Try to add to Google Calendar if user has connected it
    const user = await User.findById(req.user.userId);
    if (user && user.googleCalendarToken) {
      try {
        const googleEventId = await googleCalendarService.createGoogleCalendarEvent(user, newEvent);
        newEvent.googleCalendarEventId = googleEventId;
        await newEvent.save();
      } catch (error) {
        console.error('Error adding to Google Calendar:', error);
        // Continue without Google Calendar integration
      }
    }
    
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
    if (user && user.googleCalendarToken && event.googleCalendarEventId) {
      try {
        await googleCalendarService.updateGoogleCalendarEvent(
          user, 
          event.googleCalendarEventId, 
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
    if (user && user.googleCalendarToken && event.googleCalendarEventId) {
      try {
        await googleCalendarService.deleteGoogleCalendarEvent(
          user, 
          event.googleCalendarEventId
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
    
    if (event.googleCalendarEventId) {
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
    event.googleCalendarEventId = googleEventId;
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
