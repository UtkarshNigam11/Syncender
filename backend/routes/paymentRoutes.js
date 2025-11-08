const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Get subscription status
router.get('/subscription-status', protect, paymentController.getSubscriptionStatus);

// Create Razorpay order
router.post('/create-order', paymentController.createOrder);

// Verify payment after successful transaction
router.post('/verify', paymentController.verifyPayment);

// Cancel subscription and downgrade to free
router.post('/cancel-subscription', paymentController.cancelSubscription);

// Get subscription status
router.get('/subscription-status', paymentController.getSubscriptionStatus);

// Get payment status (optional - for checking order status)
router.get('/status/:orderId', paymentController.getPaymentStatus);

module.exports = router;
