import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: November 19, 2025
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            Syncender collects the following information:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Account Information:</strong> Name, email address from Google OAuth</li>
              <li><strong>Calendar Data:</strong> Access to create events in your Google Calendar</li>
              <li><strong>Usage Data:</strong> Your favorite teams, sports preferences, and match selections</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use your information to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Provide sports calendar integration services</li>
              <li>Create and sync calendar events automatically</li>
              <li>Display live scores and match updates</li>
              <li>Remember your favorite teams and preferences</li>
              <li>Improve our service and user experience</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Data Sharing
          </Typography>
          <Typography paragraph>
            We do not sell, trade, or rent your personal information to third parties. 
            We only share data with:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Google Calendar API:</strong> To create calendar events on your behalf</li>
              <li><strong>Sports Data Providers:</strong> To fetch match schedules and scores</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Data Security
          </Typography>
          <Typography paragraph>
            We implement industry-standard security measures including:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Encrypted data transmission (HTTPS/SSL)</li>
              <li>Secure authentication with JWT tokens</li>
              <li>Protected API endpoints</li>
              <li>Regular security updates</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Revoke Google Calendar access anytime</li>
              <li>Delete your account and all associated data</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Google Calendar Permissions
          </Typography>
          <Typography paragraph>
            Syncender uses Google Calendar API to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Create events for sports matches you select</li>
              <li>Add match details (teams, venue, time) to events</li>
              <li>Update event information if match details change</li>
            </ul>
          </Typography>
          <Typography paragraph>
            We <strong>never</strong> read, modify, or delete your existing calendar events. 
            You can revoke access at any time through your Google Account settings.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Cookies
          </Typography>
          <Typography paragraph>
            We use essential cookies for authentication and session management. 
            No tracking or advertising cookies are used.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Contact Us
          </Typography>
          <Typography paragraph>
            For privacy-related questions or requests, contact us at:
            <br />
            Email: <a href="mailto:support@syncender.app">support@syncender.app</a>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            9. Changes to This Policy
          </Typography>
          <Typography paragraph>
            We may update this Privacy Policy periodically. 
            Continued use of Syncender after changes constitutes acceptance of the updated policy.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Privacy;
