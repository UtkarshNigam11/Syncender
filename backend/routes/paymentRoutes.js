const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Create mock payment session
router.post('/create-payment-session', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan === 'pro' && user.planStatus === 'active') {
      return res.status(400).json({ message: 'You already have an active Pro subscription' });
    }

    // Create mock payment session
    const paymentSession = {
      sessionId: `mock_session_${Date.now()}_${userId}`,
      amount: 39, // ₹39
      currency: 'INR',
      userId: userId,
      plan: 'pro',
      status: 'pending',
      createdAt: new Date()
    };

    res.json({
      success: true,
      session: paymentSession
    });
  } catch (error) {
    console.error('Create payment session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process mock payment
router.post('/process-payment', protect, async (req, res) => {
  try {
    const { sessionId, paymentMethod } = req.body;
    const userId = req.user.userId;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Mock payment validation
    if (!sessionId.startsWith('mock_session_')) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    // Find user and upgrade to Pro
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user subscription
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

    user.plan = 'pro';
    user.planStatus = 'active';
    user.planStartedAt = now;
    user.planExpiresAt = expiryDate;

    await user.save();

    // Mock payment record (in real scenario, save to Payment model)
    const paymentRecord = {
      paymentId: `mock_payment_${Date.now()}_${userId}`,
      sessionId,
      userId,
      amount: 39,
      currency: 'INR',
      status: 'success',
      plan: 'pro',
      paymentMethod: paymentMethod || 'mock',
      transactionDate: now,
      expiryDate: expiryDate
    };

    res.json({
      success: true,
      message: 'Payment successful! You are now a Pro subscriber.',
      payment: paymentRecord,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        planStatus: user.planStatus,
        planStartedAt: user.planStartedAt,
        planExpiresAt: user.planExpiresAt
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

// Get subscription status
router.get('/subscription-status', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription has expired
    if (user.plan === 'pro' && user.planExpiresAt && new Date() > user.planExpiresAt) {
      user.planStatus = 'expired';
      await user.save();
    }

    res.json({
      success: true,
      subscription: {
        plan: user.plan,
        status: user.planStatus,
        startedAt: user.planStartedAt,
        expiresAt: user.planExpiresAt,
        isActive: user.plan === 'pro' && user.planStatus === 'active'
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan !== 'pro') {
      return res.status(400).json({ message: 'No active Pro subscription found' });
    }

    user.planStatus = 'canceled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription canceled. You will continue to have Pro access until the end of your billing period.',
      subscription: {
        plan: user.plan,
        status: user.planStatus,
        expiresAt: user.planExpiresAt
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
