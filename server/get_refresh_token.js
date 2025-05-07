const express = require('express');
const { GoogleAdsApi } = require('google-ads-api');
const { OAuth2Client } = require('google-auth-library');


let CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';





const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const app = express();

// Step 1: Redirect user to Google's consent screen
app.get('/', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/adwords'],
    prompt: 'consent',
  });
  res.redirect(url);
});

// Step 2: Google redirects back with code
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  console.log('✅ Your refresh token:', tokens.refresh_token);
  res.send('Authorization successful! You can close this tab.');
});

app.listen(3000, () => {
  console.log('🔗 Open http://localhost:3000 in your browser to start OAuth2 flow');
});
