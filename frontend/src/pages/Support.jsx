import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Email,
  Phone,
  Search,
  CreditCard,
  AccountCircle,
  Star,
  Help,
  ContentCopy
} from '@mui/icons-material';

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Copy to clipboard function
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbar({ open: true, message: `${label} copied to clipboard!` });
    }).catch(() => {
      setSnackbar({ open: true, message: 'Failed to copy. Please try again.' });
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // FAQ data
  const faqs = [
    {
      category: 'Account',
      icon: <AccountCircle />,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Register" on the login page, enter your email and password, or sign in with Google for quick access.'
        },
        {
          q: 'I forgot my password, what should I do?',
          a: 'Click "Forgot Password" on the login page and follow the email instructions to reset your password.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, go to Settings → Account → Delete Account. Please note this action is permanent and cannot be undone.'
        },
        {
          q: 'How do I connect my Google Calendar?',
          a: 'Go to Profile page, click "Connect Google Calendar" and grant the necessary permissions. This allows automatic syncing of your favorite teams\' matches.'
        }
      ]
    },
    {
      category: 'Billing',
      icon: <CreditCard />,
      questions: [
        {
          q: 'How do I upgrade to Pro?',
          a: 'Go to the Subscription page, click "Upgrade to Pro" button, and complete the payment securely via Razorpay. You\'ll get instant access to Pro features.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major payment methods via Razorpay including UPI, Credit/Debit Cards, Net Banking, and popular Wallets like Paytm, PhonePe, and Google Pay.'
        },
        {
          q: 'Can I get a refund?',
          a: 'Yes, we offer refunds within 7 days of payment. Contact us at support@syncender.com with your payment details for refund requests.'
        },
        {
          q: 'How much does the Pro plan cost?',
          a: 'The Pro plan costs ₹499/month and gives you access to 7 favorite teams (compared to 2 in the free plan), along with priority support.'
        },
        {
          q: 'Will my card details be stored?',
          a: 'No, we never store your card details. All payments are processed securely through Razorpay\'s PCI-DSS compliant gateway.'
        }
      ]
    },
    {
      category: 'Features',
      icon: <Star />,
      questions: [
        {
          q: 'How do I add favorite teams?',
          a: 'Go to Favorites page → Select a Sport (Cricket, Soccer, NBA, NFL) → Select a League → Click the star icon on teams you want to follow.'
        },
        {
          q: 'What is auto-sync and how does it work?',
          a: 'Auto-sync automatically adds your favorite teams\' upcoming matches to your Google Calendar daily at 12:00 AM. You\'ll get calendar notifications for upcoming games!'
        },
        {
          q: 'How many teams can I follow?',
          a: 'Free plan allows you to follow 2 teams. Pro plan allows up to 7 teams across all sports.'
        },
        {
          q: 'Which sports are supported?',
          a: 'We support Cricket (IPL, BBL, PSL, CPL, SA20, ICC), Soccer/Football (EPL, UCL, La Liga, Bundesliga, Serie A, Ligue 1), NBA (Basketball), and NFL (American Football).'
        },
        {
          q: 'Can I follow teams from different sports?',
          a: 'Absolutely! You can mix and match teams from Cricket, Soccer, NBA, and NFL within your limit (2 for free, 7 for Pro).'
        },
        {
          q: 'How often are match schedules updated?',
          a: 'Match schedules are updated automatically every 10 minutes when matches are live, and daily at midnight for upcoming matches.'
        }
      ]
    },
    {
      category: 'Technical',
      icon: <Help />,
      questions: [
        {
          q: 'Google Calendar sync not working?',
          a: 'Try disconnecting and reconnecting: Go to Profile → Click "Disconnect Google Calendar" → Then click "Connect Google Calendar" again and grant all required permissions.'
        },
        {
          q: 'Matches not showing up on my dashboard?',
          a: 'First, check your internet connection. If the issue persists, refresh the page. Matches sync automatically, but you can also try logging out and logging back in.'
        },
        {
          q: 'Payment failed but money was deducted?',
          a: 'Don\'t worry! If your payment failed but amount was deducted, it will be automatically refunded to your account within 3-5 business days. Contact us if it takes longer.'
        },
        {
          q: 'Why am I not receiving calendar notifications?',
          a: 'Make sure you\'ve granted Google Calendar permissions and check your Google Calendar notification settings. Also verify that calendar sync is enabled in your Profile.'
        },
        {
          q: 'The app is slow or not loading properly',
          a: 'Try clearing your browser cache and cookies, or try using a different browser. Make sure you have a stable internet connection. If the issue persists, contact support.'
        }
      ]
    }
  ];

  // Filter FAQs based on search
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      qa => 
        qa.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const displayFaqs = searchQuery ? filteredFaqs : faqs;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          How can we help? 🤝
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers to common questions or get in touch with our support team
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 6 }}>
        <TextField
          fullWidth
          placeholder="Search for answers... (e.g., 'payment', 'sync', 'upgrade')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': { 
              borderRadius: 3,
              backgroundColor: 'background.paper'
            }
          }}
        />
      </Box>

      {/* Quick Stats */}
      {!searchQuery && (
        <>
          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
            Browse by Category
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {faqs.map((category, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => document.getElementById(category.category)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ fontSize: 48, mb: 1, color: 'primary.main' }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>{category.category}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.questions.length} article{category.questions.length !== 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* FAQ Accordion */}
      <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
        {searchQuery ? `Search Results (${displayFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)})` : 'Frequently Asked Questions'}
      </Typography>

      {displayFaqs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try different keywords or contact our support team
          </Typography>
        </Box>
      ) : (
        displayFaqs.map((category, idx) => (
          <Box key={idx} id={category.category} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {category.icon} {category.category}
            </Typography>
            {category.questions.map((qa, qIdx) => (
              <Accordion key={qIdx} sx={{ mb: 1 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore />}
                  sx={{ 
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <Typography fontWeight={500}>{qa.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'background.default' }}>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {qa.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))
      )}

      {/* Contact Section */}
      <Box 
        sx={{ 
          mt: 8, 
          p: 4, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: 3
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Still need help?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          Our support team is here to assist you. We typically respond within 24 hours.
        </Typography>
        
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Tooltip title="Click to copy email" arrow>
              <Box 
                onClick={() => copyToClipboard('support@syncender.com', 'Email')}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Email />
                <Typography fontWeight={500}>support@syncender.com</Typography>
                <ContentCopy sx={{ fontSize: 18, opacity: 0.7 }} />
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Tooltip title="Click to copy phone number" arrow>
              <Box 
                onClick={() => copyToClipboard('+91-9817477763', 'Phone number')}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Phone />
                <Typography fontWeight={500}>+91-9817477763</Typography>
                <ContentCopy sx={{ fontSize: 18, opacity: 0.7 }} />
              </Box>
            </Tooltip>
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          size="large"
          sx={{ 
            mt: 2,
            backgroundColor: 'white',
            color: 'primary.main',
            fontWeight: 600,
            px: 4,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }
          }}
          href="mailto:support@syncender.com"
        >
          Contact Support
        </Button>
      </Box>

      {/* Snackbar for copy confirmation */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Support;
