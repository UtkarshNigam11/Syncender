const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 * POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Create order request received');
    
    // Get user from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    console.log('🔑 Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('✅ User ID:', userId);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', user.email);

    // Check if user is already Pro
    if (user.plan === 'pro') {
      console.log('⚠️ User is already Pro');
      return res.status(400).json({ 
        success: false, 
        message: 'You are already a Pro user!' 
      });
    }

    console.log('💳 Creating Razorpay order...');
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    
    // Create order with Razorpay
    const options = {
      amount: 3900, // ₹39 = 3900 paise (Razorpay uses smallest currency unit)
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`, // Keep it short (max 40 chars)
      notes: {
        userId: userId.toString(),
        plan: 'pro',
        description: 'Syncender Pro Plan Subscription'
      }
    };

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID // Send public key to frontend
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/payment/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing payment details' 
      });
    }

    // Get user from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Verify signature (Security check)
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Check if signatures match
    if (expectedSignature !== razorpay_signature) {
      console.error('Payment verification failed: Invalid signature');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed. Invalid signature.' 
      });
    }

    // Signature is valid - Payment is genuine!
    console.log('✅ Payment verified successfully for user:', userId);

    // Update user to Pro plan
    const user = await User.findByIdAndUpdate(
      userId,
      {
        plan: 'pro',
        'subscription.status': 'active',
        'subscription.startDate': new Date(),
        'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        'subscription.razorpayOrderId': razorpay_order_id,
        'subscription.razorpayPaymentId': razorpay_payment_id,
        'subscription.amount': 499,
        'subscription.currency': 'INR'
      },
      { new: true }
    ).select('-password');

    console.log('✅ User upgraded to Pro:', user.email);

    res.json({
      success: true,
      message: 'Payment verified successfully! You are now a Pro user.',
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
};

/**
 * Get Payment Status
 * GET /api/payment/status/:orderId
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await razorpay.orders.fetch(orderId);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment status',
      error: error.message 
    });
  }
};

/**
 * Get Subscription Status
 * GET /api/payment/subscription-status
 */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('📊 User plan:', user.plan);
    console.log('📊 User subscription:', user.subscription);

    // Fix: If user is Pro but status is not set correctly, fix it
    if (user.plan === 'pro' && (!user.subscription?.status || user.subscription?.status === 'free')) {
      console.log('⚠️ Fixing inconsistent subscription status...');
      user.subscription = user.subscription || {};
      user.subscription.status = 'active';
      
      // Set dates if not present
      if (!user.subscription.startDate) {
        user.subscription.startDate = new Date();
      }
      if (!user.subscription.endDate) {
        user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
      }
      
      await user.save();
      console.log('✅ Subscription status fixed to active');
    }

    // Check if Pro subscription has expired
    if (user.plan === 'pro' && user.subscription?.endDate) {
      if (new Date() > new Date(user.subscription.endDate)) {
        user.plan = 'free';
        user.subscription.status = 'expired';
        await user.save();
      }
    }

    const isActive = user.plan === 'pro' && user.subscription?.status === 'active';
    console.log('📊 isActive calculation:', isActive, '(plan:', user.plan, ', status:', user.subscription?.status, ')');

    res.json({
      success: true,
      subscription: {
        plan: user.plan,
        status: user.subscription?.status || 'free',
        startedAt: user.subscription?.startDate,
        expiresAt: user.subscription?.endDate,
        isActive: isActive
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscription status',
      error: error.message 
    });
  }
};

/**
 * Cancel Subscription and Downgrade to Free
 * POST /api/payment/cancel-subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    // Get user from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user has Pro plan
    if (user.plan !== 'pro') {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not on a Pro plan' 
      });
    }

    // Downgrade to free
    user.plan = 'free';
    user.subscription = {
      status: 'cancelled',
      startDate: user.subscription?.startDate || null,
      endDate: new Date(),
      razorpayOrderId: user.subscription?.razorpayOrderId || null,
      razorpayPaymentId: user.subscription?.razorpayPaymentId || null
    };

    await user.save();

    console.log('✅ Subscription cancelled for user:', user.email);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You are now on the Free plan.',
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel subscription',
      error: error.message 
    });
  }
};
