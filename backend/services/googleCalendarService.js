const { google } = require('googleapis');
const { createOAuthClient, getAccessToken } = require('../config/google');

/**
 * Create a Google Calendar event
 * @param {Object} user - User object with Google Calendar tokens
 * @param {Object} eventData - Event data
 * @returns {string} - Google Calendar event ID
 */
exports.createGoogleCalendarEvent = async (user, eventData) => {
  if (!user.googleCalendarToken || !user.googleCalendarToken.accessToken) {
    throw new Error('User has not connected Google Calendar');
  }

  try {
    const oauth2Client = createOAuthClient(
      user.googleCalendarToken.accessToken,
      user.googleCalendarToken.refreshToken
    );
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const tz = user.preferences?.timezone || 'Asia/Kolkata';
    const enableRem = user.preferences?.notifications?.matchReminders;
    const minutes = user.preferences?.notifications?.reminderMinutes ?? 30;

    const googleEvent = {
      summary: eventData.title,
      description: `${eventData.sport} match: ${eventData.teams?.away || eventData.teams?.[1] || ''} vs ${eventData.teams?.home || eventData.teams?.[0] || ''}\n${eventData.description || ''}`,
      start: {
        dateTime: eventData.startTime,
        timeZone: tz,
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: tz,
      },
      location: eventData.location,
      reminders: enableRem ? { useDefault: false, overrides: [{ method: 'popup', minutes }] } : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    return response.data.id;
  } catch (error) {
    if (error.code === 401) {
      throw new Error('Google Calendar authorization expired. Please reconnect your Google account.');
    }
    throw new Error(`Failed to create Google Calendar event: ${error.message}`);
  }
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

  const tz = user.preferences?.timezone || 'Asia/Kolkata';
  const enableRem = user.preferences?.notifications?.matchReminders;
  const minutes = user.preferences?.notifications?.reminderMinutes ?? 30;

  const googleEvent = {
    summary: eventData.title,
    description: `${eventData.sport} match: ${eventData.teams?.away || eventData.teams?.[1] || ''} vs ${eventData.teams?.home || eventData.teams?.[0] || ''}\n${eventData.description || ''}`,
    start: {
      dateTime: eventData.startTime,
      timeZone: tz,
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: tz,
    },
    location: eventData.location,
    reminders: enableRem ? { useDefault: false, overrides: [{ method: 'popup', minutes }] } : undefined,
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
