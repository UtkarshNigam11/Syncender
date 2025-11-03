const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Apply auth middleware to all routes
router.use(protect);

// Validation middleware for event data
const validateEvent = [
  body('title').notEmpty().withMessage('Title is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('sport').notEmpty().withMessage('Sport is required'),
];

// Get all events for the authenticated user
router.get('/', eventController.getEvents);

// Check if events exist (batch check)
router.post('/check-exists', eventController.checkEventsExist);

// Debug endpoint to see raw event data
router.get('/debug', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({ user: req.user.userId }).select('title googleCalendarEventId externalIds startTime');
    res.json({
      success: true,
      count: events.length,
      events: events.map(e => ({
        id: e._id,
        title: e.title,
        startTime: e.startTime,
        googleCalendarEventId: e.googleCalendarEventId,
        externalIds: e.externalIds
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync events with Google Calendar (two-way sync)
router.post('/sync-google', eventController.syncWithGoogleCalendar);

// Create a new event
router.post('/', eventController.createEvent);

// Add event to Google Calendar
router.post('/:eventId/google', eventController.addToGoogleCalendar);

// Get a specific event
router.get('/:id', eventController.getEventById);

// Update an event
router.put('/:id', validateEvent, eventController.updateEvent);

// Delete an event
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
