const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/google');
const { protect } = require('../middleware/auth');

// Frontend base URL for redirects
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Validation middleware
const validateRegistration = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ 
        success: false,
        message: 'Authorization code is missing' 
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
      throw new Error('Failed to get tokens from Google');
    }

    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    if (!data || !data.email) {
      throw new Error('Failed to get user info from Google');
    }

    // Find or create user
    let user = await User.findOne({ email: data.email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email: data.email,
        name: data.name || data.email.split('@')[0], // Fallback to email username if name not provided
        password: Math.random().toString(36).slice(-8), // Generate random password
        googleCalendarToken: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date)
        }
      });
    } else {
      // Update existing user's Google Calendar tokens
      user.googleCalendarToken = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date)
      };
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Redirect to frontend with token
    const redirectUrl = `${CLIENT_URL}/auth/google/callback?token=${encodeURIComponent(token)}`;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    // Redirect with error message
    const errorUrl = `${CLIENT_URL}/login?error=${encodeURIComponent('Google OAuth failed')}`;
    return res.redirect(302, errorUrl);
  }
});

// Google OAuth login/signup route (PUBLIC - for initial authentication)
router.get('/google', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      response_type: 'code',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate auth URL',
      error: error.message 
    });
  }
});

// Google OAuth - Link calendar to existing authenticated user
router.get('/google/link', protect, (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      response_type: 'code',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      state: req.user.userId, // Pass user ID to maintain context
    });
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate auth URL',
      error: error.message 
    });
  }
});

module.exports = router;
 
// Placeholder: logout from all devices
// NOTE: Proper implementation requires token versioning or blacklist.
router.post('/logout-all', (req, res) => {
  try {
    return res.json({ success: true, message: 'Logout-all requested. Please change your password to invalidate old sessions.' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});