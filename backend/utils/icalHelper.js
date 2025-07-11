const ical = require('node-ical');
const { v4: uuidv4 } = require('uuid');

exports.generateICSFile = ({ summary, description, startTime, endTime, location }) => {
  // Format dates according to iCalendar spec
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\./g, '').slice(0, 15) + 'Z';
  };

  const now = new Date();
  const formattedNow = formatDate(now);
  const formattedStart = formatDate(new Date(startTime));
  const formattedEnd = formatDate(new Date(endTime));
  
  // Create ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sports Calendar Integration//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uuidv4()}`,
    `DTSTAMP:${formattedNow}`,
    `DTSTART:${formattedStart}`,
    `DTEND:${formattedEnd}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icsContent;
};