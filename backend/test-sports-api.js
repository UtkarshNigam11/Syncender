const axios = require('axios');

// Test the sports API endpoints
async function testSportsAPI() {
  const baseURL = 'http://localhost:5000/api/sports';
  
  console.log('🧪 Testing Sports API Implementation...\n');

  // First, you'll need to get a JWT token by logging in
  console.log('📝 Step 1: Get JWT Token');
  console.log('POST http://localhost:5000/api/auth/login');
  console.log('Body: { "email": "your-email", "password": "your-password" }\n');

  console.log('📝 Step 2: Test Sports Endpoints (add Authorization: Bearer <token>)');
  
  const endpoints = [
    {
      name: 'Get Supported Sports',
      url: `${baseURL}/sports`,
      method: 'GET'
    },
    {
      name: 'Get NFL Live Scores',
      url: `${baseURL}/scores/nfl`,
      method: 'GET'
    },
    {
      name: 'Get NBA Teams',
      url: `${baseURL}/teams/nba`,
      method: 'GET'
    },
    {
      name: 'Get MLB Standings',
      url: `${baseURL}/standings/mlb`,
      method: 'GET'
    },
    {
      name: 'Search Team (Lakers)',
      url: `${baseURL}/team/Lakers/details`,
      method: 'GET'
    },
    {
      name: 'Get All Leagues',
      url: `${baseURL}/leagues`,
      method: 'GET'
    }
  ];

  endpoints.forEach((endpoint, index) => {
    console.log(`${index + 1}. ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${endpoint.url}\n`);
  });

  console.log('📝 Step 3: Test Event Creation from Sports Data');
  console.log(`POST ${baseURL}/create-event`);
  console.log(`Body: {
    "gameId": "401547439",
    "sport": "nfl",
    "teams": {
      "home": "New York Giants",
      "away": "Dallas Cowboys"
    },
    "gameTime": "2025-02-01T18:00:00Z",
    "venue": "MetLife Stadium"
  }\n`);

  console.log('🔧 Manual Test Instructions:');
  console.log('1. Start server: npm run dev');
  console.log('2. Login to get JWT token');
  console.log('3. Use Postman/Insomnia to test above endpoints with Authorization header');
  console.log('4. Header: Authorization: Bearer <your-jwt-token>');
}

// Test direct API calls (without authentication for external APIs)
async function testExternalAPIs() {
  console.log('\n🌐 Testing External APIs Directly...\n');

  try {
    // Test ESPN API
    console.log('Testing ESPN NFL API...');
    const espnResponse = await axios.get('http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    console.log('✅ ESPN API: Working! Found', espnResponse.data.events?.length || 0, 'NFL games');
  } catch (error) {
    console.log('❌ ESPN API Error:', error.message);
  }

  try {
    // Test SportsDB API
    console.log('Testing SportsDB API...');
    const sportsDbResponse = await axios.get('https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=Lakers');
    console.log('✅ SportsDB API: Working! Found', sportsDbResponse.data.teams?.length || 0, 'teams matching "Lakers"');
  } catch (error) {
    console.log('❌ SportsDB API Error:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testSportsAPI();
  testExternalAPIs();
}

module.exports = { testSportsAPI, testExternalAPIs };
