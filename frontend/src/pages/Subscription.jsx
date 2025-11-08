import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Stars,
  Lock,
  CreditCard,
  AccountBalanceWallet,
} from '@mui/icons-material';

function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
  });

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/payment/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('📊 Subscription data:', response.data.subscription);
      setSubscription(response.data.subscription);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription status');
      setLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setProcessing(true);
      setError('');

      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'Found' : 'Not found');
      
      // Step 1: Create Razorpay order
      console.log('📦 Creating Razorpay order...');
      const orderResponse = await axios.post(
        '/api/payment/create-order',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Order created:', orderResponse.data);
      const { orderId, amount, currency } = orderResponse.data;

      // Step 2: Open Razorpay checkout popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RdBMIuSuONIaFA', // Razorpay key from env
        amount: amount,
        currency: currency,
        name: 'Syncender',
        description: 'Pro Plan Subscription - ₹39/month',
        order_id: orderId,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await axios.post(
              '/api/payment/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              setSuccess('Payment successful! You are now a Pro subscriber.');
              
              // Refresh subscription status
              setTimeout(() => {
                fetchSubscriptionStatus();
                setSuccess('');
              }, 2000);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#667eea',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            setError('Payment cancelled. Please try again.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(false);
    } catch (err) {
      console.error('❌ Payment error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Create session first
      const sessionResponse = await axios.post(
        'http://localhost:5000/api/payment/create-payment-session',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sessionId = sessionResponse.data.session.sessionId;

      // Process payment
      const paymentResponse = await axios.post(
        'http://localhost:5000/api/payment/process-payment',
        {
          sessionId,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccess('Payment successful! You are now a Pro subscriber.');
        setPaymentDialog(false);
        
        // Refresh subscription status
        setTimeout(() => {
          fetchSubscriptionStatus();
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Pro subscription and switch to the Free plan?')) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/payment/cancel-subscription',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Subscription cancelled successfully. You are now on the Free plan.');
        
        // Refresh subscription status after a short delay
        setTimeout(() => {
          fetchSubscriptionStatus();
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const freeFeatures = [
    '2 favorite teams (auto-synced)',
    'Match notifications',
    'Basic calendar sync',
    'Live scores',
  ];

  const proFeatures = [
    '7 favorite teams (auto-synced)',
    '1 league - Auto-sync all matches',
    'Priority calendar sync',
    'Ad-free experience',
    'Early access to new features',
    'Premium support',
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Subscription Plans
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose the plan that's right for you
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {/* Free Plan */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              height: '100%',
              border: subscription?.plan === 'free' ? '2px solid' : '1px solid',
              borderColor: subscription?.plan === 'free' ? 'primary.main' : 'divider',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Free Plan
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  ₹0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Forever free
                </Typography>
              </Box>

              {subscription?.plan === 'free' && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  sx={{ mb: 3, width: '100%' }}
                />
              )}

              <List>
                {freeFeatures.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pro Plan */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              height: '100%',
              border: '2px solid',
              borderColor: 'primary.main',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <Chip
              label="POPULAR"
              color="primary"
              icon={<Stars />}
              sx={{
                position: 'absolute',
                top: -12,
                right: 20,
                fontWeight: 'bold',
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Pro Plan
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  ₹39
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per month
                </Typography>
              </Box>

              {subscription?.plan === 'pro' && subscription?.isActive && (
                <Chip
                  label={`Active - Expires ${new Date(subscription.expiresAt).toLocaleDateString('en-GB')}`}
                  color="success"
                  sx={{ mb: 3, width: '100%' }}
                />
              )}

              {subscription?.plan === 'pro' && subscription?.status === 'canceled' && (
                <Chip
                  label={`Canceled - Access until ${new Date(subscription.expiresAt).toLocaleDateString('en-GB')}`}
                  color="warning"
                  sx={{ mb: 3, width: '100%' }}
                />
              )}

              <List>
                {proFeatures.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>

              {/* Show Upgrade button only if NOT already Pro and Active */}
              {(() => {
                const isPro = subscription?.plan === 'pro';
                const isActive = subscription?.isActive;
                console.log('🔍 Button logic - isPro:', isPro, 'isActive:', isActive, 'subscription:', subscription);
                return !(isPro && isActive);
              })() && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleUpgradeToPro}
                  disabled={processing}
                  sx={{ mt: 3 }}
                  startIcon={processing ? <CircularProgress size={20} /> : <Stars />}
                >
                  {processing ? 'Processing...' : 'Upgrade to Pro'}
                </Button>
              )}

              {/* Show Cancel button only if Pro and Active */}
              {subscription?.plan === 'pro' && subscription?.isActive && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  color="error"
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  sx={{ mt: 3 }}
                >
                  {processing ? 'Processing...' : 'Switch to Free Plan'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => !processing && setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock color="primary" />
            <Typography variant="h6">Secure Payment</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold">
              ₹39
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pro Plan - Monthly Subscription
            </Typography>
          </Box>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Payment Method</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel
                value="upi"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWallet />
                    <Typography>UPI (Recommended)</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="card"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCard />
                    <Typography>Credit/Debit Card</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {paymentMethod === 'upi' && (
            <TextField
              fullWidth
              label="UPI ID"
              placeholder="yourname@upi"
              value={paymentDetails.upiId}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          {paymentMethod === 'card' && (
            <Box>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="John Doe"
                value={paymentDetails.cardName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    placeholder="123"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Alert severity="info" icon={<Lock />}>
            This is a mock payment gateway. No real transaction will be processed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setPaymentDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessPayment}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <Lock />}
          >
            {processing ? 'Processing...' : 'Pay ₹39'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Subscription;
