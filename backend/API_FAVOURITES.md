# User Favourites API Endpoints

## Authentication Required
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Get All Favourites
Get both teams and leagues for the authenticated user.

**Endpoint:** `GET /api/favourites/all`

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "sport": "cricket",
        "league": "ipl",
        "teamId": "MI",
        "name": "Mumbai Indians",
        "shortName": "MI",
        "logo": "https://upload.wikimedia.org/...",
        "addedAt": "2025-11-07T10:30:00.000Z"
      }
    ],
    "leagues": []
  },
  "limits": {
    "teams": 2,     // 2 for free, 7 for pro
    "leagues": 0    // 0 for free, 1 for pro
  },
  "count": {
    "teams": 1,
    "leagues": 0
  },
  "plan": "free"
}
```

---

## 🏆 Favourite Teams

### Get Favourite Teams
**Endpoint:** `GET /api/favourites/teams`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sport": "cricket",
      "league": "ipl",
      "teamId": "MI",
      "name": "Mumbai Indians",
      "shortName": "MI",
      "logo": "https://...",
      "addedAt": "2025-11-07T10:30:00.000Z"
    }
  ],
  "count": 1,
  "limit": 2,
  "plan": "free"
}
```

### Add Favourite Team
**Endpoint:** `POST /api/favourites/teams`

**Request Body:**
```json
{
  "sport": "cricket",
  "league": "ipl",
  "teamId": "MI",
  "name": "Mumbai Indians",
  "shortName": "MI",
  "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/200px-Mumbai_Indians_Logo.svg.png"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Team added to favourites",
  "data": [...],
  "count": 1,
  "limit": 2
}
```

**Error - Limit Reached (Free Plan):**
```json
{
  "success": false,
  "message": "FREE plan allows maximum 2 favourite teams",
  "limit": 2,
  "currentCount": 2,
  "upgradeRequired": true
}
```

**Error - Already Exists:**
```json
{
  "success": false,
  "message": "Team already in favourites"
}
```

### Remove Favourite Team
**Endpoint:** `DELETE /api/favourites/teams/:teamId?sport=cricket`

**Examples:**
```bash
# Remove by teamId only
DELETE /api/favourites/teams/MI

# Remove specific team by sport + teamId (recommended)
DELETE /api/favourites/teams/MI?sport=cricket
```

**Response:**
```json
{
  "success": true,
  "message": "Team removed from favourites",
  "data": [...],
  "count": 0
}
```

---

## 🎯 Favourite Leagues (PRO Feature)

### Get Favourite Leagues
**Endpoint:** `GET /api/favourites/leagues`

**Response (Free Plan):**
```json
{
  "success": true,
  "data": [],
  "count": 0,
  "limit": 0,
  "plan": "free"
}
```

**Response (Pro Plan):**
```json
{
  "success": true,
  "data": [
    {
      "sport": "soccer",
      "league": "eng.1",
      "name": "English Premier League",
      "logo": "https://...",
      "addedAt": "2025-11-07T10:35:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "plan": "pro"
}
```

### Add Favourite League (Pro Only)
**Endpoint:** `POST /api/favourites/leagues`

**Request Body:**
```json
{
  "sport": "soccer",
  "league": "eng.1",
  "name": "English Premier League",
  "logo": "https://..."
}
```

**Success Response (Pro Plan):**
```json
{
  "success": true,
  "message": "League added to favourites",
  "data": [...],
  "count": 1,
  "limit": 1
}
```

**Error - Free Plan:**
```json
{
  "success": false,
  "message": "League auto-sync is a PRO feature",
  "upgradeRequired": true,
  "feature": "League Auto-Sync"
}
```

**Error - Limit Reached (Pro Plan):**
```json
{
  "success": false,
  "message": "PRO plan allows maximum 1 favourite league",
  "limit": 1,
  "currentCount": 1
}
```

### Remove Favourite League
**Endpoint:** `DELETE /api/favourites/leagues/:league?sport=soccer`

**Examples:**
```bash
# Remove by league code only
DELETE /api/favourites/leagues/eng.1

# Remove specific league by sport + code (recommended)
DELETE /api/favourites/leagues/eng.1?sport=soccer
```

**Response:**
```json
{
  "success": true,
  "message": "League removed from favourites",
  "data": [],
  "count": 0
}
```

---

## 📊 Subscription Limits

| Plan | Favourite Teams | Favourite Leagues | Auto-Sync |
|------|----------------|-------------------|-----------|
| **Free** | 2 teams | 0 leagues | ❌ No |
| **Pro** | 7 teams | 1 league | ✅ Yes |

---

## 🧪 Testing Examples

### With cURL:

```bash
# Get JWT token first
TOKEN="your-jwt-token-here"

# Get all favourites
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favourites/all

# Add Mumbai Indians
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "cricket",
    "league": "ipl",
    "teamId": "MI",
    "name": "Mumbai Indians",
    "shortName": "MI",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/200px-Mumbai_Indians_Logo.svg.png"
  }' \
  http://localhost:5000/api/favourites/teams

# Get favourite teams
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favourites/teams

# Remove a team
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/favourites/teams/MI?sport=cricket"
```

### With Axios (Frontend):

```javascript
// In your Favourites.jsx component

// Get all favourites
const response = await axios.get('/api/favourites/all', {
  headers: { Authorization: `Bearer ${token}` }
});

// Add team
await axios.post('/api/favourites/teams', {
  sport: 'cricket',
  league: 'ipl',
  teamId: 'MI',
  name: 'Mumbai Indians',
  shortName: 'MI',
  logo: 'https://...'
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Remove team
await axios.delete(`/api/favourites/teams/${teamId}?sport=${sport}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## ✅ Implementation Status

- ✅ Backend controller created
- ✅ Routes configured  
- ✅ User model updated
- ✅ Server routes registered
- ✅ Subscription limits enforced
- ⏳ Frontend integration (next step)

---

## 🔄 Next Steps

1. **Restart backend server** to load new routes
2. **Update Favourites.jsx** to use these real API endpoints
3. **Test in browser** with real user authentication
4. **Verify subscription limits** (try adding 3rd team on free plan)
5. **Test Pro features** (league auto-sync)
