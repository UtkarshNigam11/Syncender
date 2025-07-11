const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/google/callback'  // Updated to match our auth callback route
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'  // This ensures we always get a refresh token
});

console.log('\nAuthorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\nAfter authorizing, you will be redirected to a page with your refresh token.\n');
console.log('Make sure your server is running at http://localhost:5000 before clicking the URL!\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('\nEnter the code from that page here: ', (code) => {
  readline.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('\n✅ Your Refresh Token:\n');
    console.log(token.refresh_token);
  });
});
