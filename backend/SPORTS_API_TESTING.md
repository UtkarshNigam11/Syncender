# Sports API Test Routes

## Test the API endpoints using these examples:

### 1. Get supported sports
```bash
GET http://localhost:5000/api/sports/sports
```

### 2. Get NFL live scores
```bash
GET http://localhost:5000/api/sports/scores/nfl
```

### 3. Get NBA teams
```bash
GET http://localhost:5000/api/sports/teams/nba
```

### 4. Get MLB standings
```bash
GET http://localhost:5000/api/sports/standings/mlb
```

### 5. Search for a team (Lakers)
```bash
GET http://localhost:5000/api/sports/team/Lakers/details
```

### 6. Get all leagues
```bash
GET http://localhost:5000/api/sports/leagues
```

### 7. Search for a player (LeBron James)
```bash
GET http://localhost:5000/api/sports/player/LeBron James/search
```

### 8. Create event from sports data
```bash
POST http://localhost:5000/api/sports/create-event
Content-Type: application/json

{
  "gameId": "401547439",
  "sport": "nfl",
  "teams": {
    "home": "New York Giants",
    "away": "Dallas Cowboys"
  },
  "gameTime": "2025-02-01T18:00:00Z",
  "venue": "MetLife Stadium"
}
```

## Note: 
- All routes require authentication (Bearer token in Authorization header)
- ESPN API provides real-time data for major US sports
- SportsDB provides detailed information for teams, players, and leagues worldwide
