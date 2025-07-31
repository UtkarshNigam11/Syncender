const express = require('express');
const router = express.Router();
const appleController = require('../controllers/appleController');
const { protect } = require('../middleware/auth');

// Download Apple Calendar ICS file
router.post('/calendar', protect, appleController.getAppleCalendarICS);

module.exports = router;
