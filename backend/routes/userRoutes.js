const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { getPlanLimits } = require('../controllers/subscriptionController');
const { syncUserFavoriteMatches } = require('../services/cronService');

router.use(protect);

// Get current user
router.get('/me', async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update current user
router.put('/me', async (req, res) => {
  try {
    const { name, password, newPassword, preferences } = req.body;
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;

    if (newPassword) {
      if (!password) return res.status(400).json({ message: 'Current password required' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
      user.password = newPassword; // will be hashed by pre('save')
    }

    if (preferences) {
      const current = user.preferences?.toObject?.() || user.preferences || {};
      user.preferences = {
        ...current,
        ...preferences,
        notifications: { ...(current.notifications || {}), ...(preferences.notifications || {}) },
        appearance: { ...(current.appearance || {}), ...(preferences.appearance || {}) },
      };
      const limits = getPlanLimits(user.plan);
      const favTeams = user.preferences.favoriteTeams || [];
      if (favTeams.length > limits.favoriteTeams) {
        return res.status(400).json({ message: `Plan limit exceeded. You can follow up to ${limits.favoriteTeams} teams.` });
      }
    }

    await user.save();
    const sanitized = await User.findById(user._id).select('-password');
    res.json(sanitized);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
// Disconnect Google Calendar (remove stored tokens)
router.delete('/me/google-calendar', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.googleCalendarToken = undefined;
    await user.save();
    res.json({ success: true, message: 'Disconnected Google Calendar' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual trigger for auto-sync (for testing)
router.post('/me/sync-favorites', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.preferences?.favoriteTeams?.length) {
      return res.status(400).json({ message: 'No favorite teams selected' });
    }
    
    if (!user.googleCalendarToken?.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    await syncUserFavoriteMatches(user);
    res.json({ success: true, message: 'Favorite teams synced successfully' });
  } catch (e) {
    console.error('Manual sync error:', e);
    res.status(500).json({ message: 'Error syncing favorites: ' + e.message });
  }
});
