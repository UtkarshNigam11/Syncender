# Syncender Sports API - Test Commands

## 1. Start the server
cd backend
npm run dev

## 2. Register a new user (if needed)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123"
  }'

## 3. Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Copy the "token" from the response and use it in the commands below

## 4. Test Sports API Endpoints (replace YOUR_JWT_TOKEN with actual token)

# Get supported sports
curl -X GET http://localhost:5000/api/sports/sports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get NFL live scores
curl -X GET http://localhost:5000/api/sports/scores/nfl \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get NBA teams
curl -X GET http://localhost:5000/api/sports/teams/nba \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get MLB standings
curl -X GET http://localhost:5000/api/sports/standings/mlb \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Cricket live scores/events
curl -X GET http://localhost:5000/api/sports/scores/cricket \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Cricket teams
curl -X GET http://localhost:5000/api/sports/teams/cricket \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Cricket matches (IPL)
curl -X GET http://localhost:5000/api/sports/cricket/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search team details
curl -X GET "http://localhost:5000/api/sports/team/Lakers/details" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all leagues
curl -X GET http://localhost:5000/api/sports/leagues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search for a player
curl -X GET "http://localhost:5000/api/sports/player/LeBron%20James/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create calendar event from sports data
curl -X POST http://localhost:5000/api/sports/create-event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "gameId": "401547439",
    "sport": "nfl",
    "teams": {
      "home": "New York Giants",
      "away": "Dallas Cowboys"
    },
    "gameTime": "2025-02-01T18:00:00Z",
    "venue": "MetLife Stadium"
  }'

## 5. Test Google Calendar Integration (if configured)
curl -X POST http://localhost:5000/api/events/google \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Lakers vs Warriors",
    "description": "NBA Game",
    "start": "2025-02-01T20:00:00Z",
    "end": "2025-02-01T22:30:00Z",
    "location": "Crypto.com Arena"
  }'

## 6. Test Apple Calendar ICS Generation
curl -X POST http://localhost:5000/api/apple/create-ics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Lakers vs Warriors",
    "description": "NBA Game",
    "start": "2025-02-01T20:00:00Z",
    "end": "2025-02-01T22:30:00Z",
    "location": "Crypto.com Arena"
  }'
