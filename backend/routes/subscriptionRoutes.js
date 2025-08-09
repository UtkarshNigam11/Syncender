const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSubscription, upgradePlan } = require('../controllers/subscriptionController');

router.use(protect);

router.get('/', getSubscription);
router.post('/upgrade', upgradePlan);

module.exports = router;
