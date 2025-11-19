import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: November 19, 2025
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By accessing and using Syncender ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Description of Service
          </Typography>
          <Typography paragraph>
            Syncender is a sports calendar integration platform that:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Aggregates live and upcoming sports match schedules</li>
              <li>Allows users to export matches to Google Calendar or Apple Calendar</li>
              <li>Displays real-time scores and match updates</li>
              <li>Enables users to track their favorite teams</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. User Accounts
          </Typography>
          <Typography paragraph>
            To use certain features, you must:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Be at least 13 years old</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Google Calendar Integration
          </Typography>
          <Typography paragraph>
            By connecting your Google Calendar, you authorize Syncender to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Create calendar events for selected sports matches</li>
              <li>Add match details to your calendar</li>
              <li>Update event information if match details change</li>
            </ul>
          </Typography>
          <Typography paragraph>
            You can revoke this access at any time through your Google Account settings.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Acceptable Use
          </Typography>
          <Typography paragraph>
            You agree NOT to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Use the Service for any illegal purposes</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Scrape or abuse our APIs without permission</li>
              <li>Share your account credentials with others</li>
              <li>Use automated bots or scripts to access the Service</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Data Accuracy
          </Typography>
          <Typography paragraph>
            We strive to provide accurate sports data, but:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Match schedules and scores are sourced from third-party APIs</li>
              <li>We cannot guarantee 100% accuracy or real-time updates</li>
              <li>Match times, venues, or scores may change without notice</li>
              <li>We are not responsible for errors in source data</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Service Availability
          </Typography>
          <Typography paragraph>
            We aim to provide uninterrupted service, but:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>The Service may be temporarily unavailable for maintenance</li>
              <li>We do not guarantee 24/7 uptime</li>
              <li>Free tier users may experience service limitations</li>
              <li>We reserve the right to modify or discontinue features</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content, features, and functionality of Syncender are owned by us and 
            protected by copyright, trademark, and other intellectual property laws.
          </Typography>
          <Typography paragraph>
            Sports data, team logos, and league names are property of their respective owners.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            9. Disclaimer of Warranties
          </Typography>
          <Typography paragraph>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
            WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            10. Limitation of Liability
          </Typography>
          <Typography paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Missed matches due to incorrect schedules</li>
              <li>Issues with third-party calendar services</li>
            </ul>
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            11. Account Termination
          </Typography>
          <Typography paragraph>
            We reserve the right to suspend or terminate accounts that:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Violate these Terms of Service</li>
              <li>Engage in abusive or fraudulent behavior</li>
              <li>Remain inactive for extended periods</li>
            </ul>
          </Typography>
          <Typography paragraph>
            You may delete your account at any time from your profile settings.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            12. Changes to Terms
          </Typography>
          <Typography paragraph>
            We may update these Terms of Service periodically. 
            Continued use after changes constitutes acceptance of updated terms.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            13. Governing Law
          </Typography>
          <Typography paragraph>
            These terms are governed by the laws of India. 
            Any disputes shall be resolved in the courts of [Your City], India.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            14. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms, contact us at:
            <br />
            Email: <a href="mailto:support@syncender.app">support@syncender.app</a>
          </Typography>

          <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>
            By using Syncender, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms of Service.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms;
