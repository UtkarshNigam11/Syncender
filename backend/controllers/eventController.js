const { google } = require('googleapis');
const oauth2Client = require('../config/google'); // adjust if path is different

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

exports.addEvent = async (req, res) => {
  try {
    const event = {
      summary: 'Test Sports Event',
      description: 'Football Match - Local League',
      start: {
        dateTime: '2025-05-22T18:00:00+05:30',
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: '2025-05-22T19:00:00+05:30',
        timeZone: 'Asia/Kolkata',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.status(200).json({ message: 'Event created', eventId: response.data.id });
  } catch (error) {
    console.error('❌ Google Calendar API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
};
