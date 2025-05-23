const { generateICSFile } = require('../utils/icalHelper');

exports.getAppleCalendarICS = (req, res) => {
  const { summary, description, startTime, endTime } = req.body;

  try {
    const icsFile = generateICSFile({ summary, description, startTime, endTime });
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=event.ics');
    res.send(icsFile);
  } catch (error) {
    console.error('Apple Calendar ICS Error:', error.message);
    res.status(500).json({ message: 'Failed to create ICS file', error: error.message });
  }
};
