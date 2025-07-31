const { google } = require('googleapis');
const { createOAuthClient } = require('../config/google');

/**
 * Create a Google Calendar event
 * @param {Object} user - User object with Google Calendar tokens
 * @param {Object} eventData - Event data
 * @returns {string} - Google Calendar event ID
 */
exports.createGoogleCalendarEvent = async (user, eventData) => {
  if (!user.googleCalendarToken) {
    throw new Error('User has not connected Google Calendar');
  }

  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const googleEvent = {
    summary: eventData.title,
    description: `${eventData.sport} match: ${eventData.teams?.home || ''} vs ${eventData.teams?.away || ''}\n${eventData.description || ''}`,
    start: {
      dateTime: eventData.startTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    location: eventData.location,
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: googleEvent,
  });

  return response.data.id;
};

/**
 * Update a Google Calendar event
 * @param {Object} user - User object with Google Calendar tokens
 * @param {string} googleEventId - Google Calendar event ID
 * @param {Object} eventData - Updated event data
 */
exports.updateGoogleCalendarEvent = async (user, googleEventId, eventData) => {
  if (!user.googleCalendarToken) {
    throw new Error('User has not connected Google Calendar');
  }

  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const googleEvent = {
    summary: eventData.title,
    description: `${eventData.sport} match: ${eventData.teams?.home || ''} vs ${eventData.teams?.away || ''}\n${eventData.description || ''}`,
    start: {
      dateTime: eventData.startTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    location: eventData.location,
  };

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: googleEvent,
  });
};

/**
 * Delete a Google Calendar event
 * @param {Object} user - User object with Google Calendar tokens
 * @param {string} googleEventId - Google Calendar event ID
 */
exports.deleteGoogleCalendarEvent = async (user, googleEventId) => {
  if (!user.googleCalendarToken) {
    throw new Error('User has not connected Google Calendar');
  }

  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
};

/**
 * Test Google Calendar connection
 * @param {Object} user - User object with Google Calendar tokens
 * @returns {Object} - Calendar list data
 */
exports.testGoogleCalendarConnection = async (user) => {
  if (!user.googleCalendarToken) {
    throw new Error('User has not connected Google Calendar');
  }

  const oauth2Client = createOAuthClient(
    user.googleCalendarToken.accessToken,
    user.googleCalendarToken.refreshToken
  );
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { data } = await calendar.calendarList.list();
  
  return data.items.map(cal => ({
    id: cal.id,
    summary: cal.summary,
    primary: cal.primary
  }));
};
