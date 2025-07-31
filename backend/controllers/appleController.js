const { generateICSFile } = require('../utils/icalHelper');

exports.getAppleCalendarICS = (req, res) => {
  const { summary, description, startTime, endTime, location } = req.body;

  // Validate required fields
  if (!summary || !startTime || !endTime) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: summary, startTime, endTime' 
    });
  }

  try {
    const icsFile = generateICSFile({ 
      summary, 
      description, 
      startTime, 
      endTime, 
      location 
    });
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=event.ics');
    res.send(icsFile);
  } catch (error) {
    console.error('Apple Calendar ICS Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create ICS file', 
      error: error.message 
    });
  }
};
