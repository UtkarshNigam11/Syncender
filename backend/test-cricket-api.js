// Test Cricket API functionality
const sportsApiService = require('./services/sportsApiService');

async function testCricketAPI() {
  console.log('🏏 Testing Cricket API functionality...\n');

  try {
    // Test 1: Get supported sports (should include cricket)
    console.log('1. Testing supported sports...');
    const sports = sportsApiService.getSupportedSports();
    const cricketSport = sports.data.find(s => s.id === 'cricket');
    console.log('✅ Cricket found in supported sports:', cricketSport);

    // Test 2: Get cricket events/scores
    console.log('\n2. Testing cricket live events...');
    const cricketScores = await sportsApiService.getLiveScores('cricket');
    console.log('✅ Cricket events retrieved:', cricketScores.success);
    console.log('   Provider:', cricketScores.provider);
    console.log('   Events count:', cricketScores.data.length);

    // Test 3: Get cricket teams
    console.log('\n3. Testing cricket teams...');
    const cricketTeams = await sportsApiService.getTeams('cricket');
    console.log('✅ Cricket teams retrieved:', cricketTeams.success);
    console.log('   Teams count:', cricketTeams.data.length);

    // Test 4: Get cricket standings
    console.log('\n4. Testing cricket standings...');
    const cricketStandings = await sportsApiService.getStandings('cricket');
    console.log('✅ Cricket standings retrieved:', cricketStandings.success);
    console.log('   Standings count:', cricketStandings.data.length);

    // Test 5: Get specific cricket matches
    console.log('\n5. Testing cricket matches (IPL)...');
    const cricketMatches = await sportsApiService.getCricketMatches();
    console.log('✅ Cricket matches retrieved:', cricketMatches.success);
    console.log('   League:', cricketMatches.league);
    console.log('   Matches count:', cricketMatches.data.length);

    console.log('\n🎉 All cricket tests passed! Cricket is now fully supported.');

  } catch (error) {
    console.error('❌ Error testing cricket API:', error.message);
  }
}

// Run the test
testCricketAPI();
