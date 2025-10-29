const User = require('../models/User');

// Get current user's subscription and limits
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('plan planStatus planStartedAt planExpiresAt preferences.favoriteTeams');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const limits = getPlanLimits(user.plan);

    res.json({
      success: true,
      plan: user.plan,
      planStatus: user.planStatus,
      planStartedAt: user.planStartedAt,
      planExpiresAt: user.planExpiresAt,
      limits,
      used: { favoriteTeams: (user.preferences.favoriteTeams || []).length },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update plan (mock payment flow). In production integrate real gateway.
exports.upgradePlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { plan } = req.body; // 'pro'
    if (!['pro'].includes(plan)) return res.status(400).json({ message: 'Invalid plan' });

    user.plan = 'pro';
    user.planStatus = 'active';
    user.planStartedAt = new Date();
    user.planExpiresAt = null; // non-expiring for now
    await user.save();

    res.json({ success: true, plan: user.plan });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

function getPlanLimits(plan) {
  if (plan === 'pro') return { favoriteTeams: 7, favoriteLeagues: 1 };
  return { favoriteTeams: 2, favoriteLeagues: 0 };
}

exports.getPlanLimits = getPlanLimits;
