# Sports Cache Testing Guide

This guide will help you test the **tiered caching functionality** for the sports data endpoints.

## Cache Configuration

### Tiered Caching System
- **Live Match Cache**: 10 seconds (fast-changing data)
- **Upcoming Match Cache**: 60 seconds (stable data)
- **Cricket Cache**: 2 minutes (separate system)

### Cache Structure
```javascript
liveCache = {
  nfl: { data, timestamp },
  nba: { data, timestamp },
  epl: { data, timestamp },
  ucl: { data, timestamp }
};

upcomingCache = {
  // Same structure, different TTL
};
```

## What Gets Cached?

The following data is cached with **dual-tier strategy**:

| Sport | Live Matches (10s) | Upcoming Matches (60s) |
|-------|-------------------|------------------------|
| **NFL** | ✅ Active games | ✅ Scheduled games |
| **NBA** | ✅ Active games | ✅ Scheduled games |
| **EPL** | ✅ Active matches | ✅ Scheduled matches |
| **UCL** | ✅ Active matches | ✅ Scheduled matches |
| **Cricket** | ⚠️ Separate 2-min cache (memory + DB) | ⚠️ Separate system |

## Testing Methods

### 1. Manual Testing via Browser

#### Test A: Live Cache (10s TTL)
1. Open Dashboard with Developer Tools (F12)
2. Go to Network tab, filter for `dashboard`
3. Load dashboard → Note request to `/api/sports/dashboard`
4. **Within 10 seconds**, refresh page
5. ✅ **Expected**: Response is instant (<100ms), no network request
6. Backend console shows: `📦 NFL: Using cached data`

7. **Wait 12 seconds** from initial load
8. Refresh page
9. ✅ **Expected**: New network request for live data
10. Backend console shows: `🔄 NFL: Fetching fresh data from API (live expired)`

#### Test B: Upcoming Cache (60s TTL)
1. Load dashboard
2. **Wait 15 seconds**, refresh
3. ✅ **Expected**: Live cache expired, but upcoming cache valid
4. Backend shows: `🔄 NFL: Fetching fresh data from API (live expired)` but NOT "(upcoming expired)"

5. **Wait 65 seconds** from initial load
6. Refresh page
7. ✅ **Expected**: BOTH caches expired
8. Backend shows: `🔄 NFL: Fetching fresh data from API (live expired) (upcoming expired)`

#### Test C: Refresh Button (Live Only)
1. Load Dashboard
2. Note current live match scores
3. Click refresh button (🔄) next to "Ongoing Matches"
4. ✅ **Expected**:
   - Button shows loading spinner
   - Live scores update
   - Upcoming matches stay same (not refetched)
5. Backend console shows:
   ```
   🔄 Live refresh requested - clearing live match cache only
   🔄 NFL: Fetching fresh data from API (live expired)
   📦 NFL: Using cached data (for upcoming)
   ```

#### Test D: Page Navigation Caching
1. Load Dashboard → wait 2 seconds
2. Navigate to Matches page
3. ✅ **Expected**: Instant load (<100ms), no API calls
4. Backend: `📦 NFL: Using cached data`
5. Navigate back to Dashboard (within 10s)
6. ✅ **Expected**: Still using cache
7. **Wait 11 seconds**, navigate again
8. ✅ **Expected**: Live cache expired, fresh API call

### 2. Testing via API Calls

#### Using cURL

**Test 1: Normal Request (Uses Cache)**
```bash
# First request (cache miss)
curl http://localhost:5000/api/sports/dashboard

# Immediate second request (cache hit)
curl http://localhost:5000/api/sports/dashboard

# Wait 12 seconds (live expired, upcoming valid)
sleep 12
curl http://localhost:5000/api/sports/dashboard

# Wait 65 seconds total (both expired)
sleep 53
curl http://localhost:5000/api/sports/dashboard
```

**Test 2: Refresh Live Only (Recommended)**
```bash
curl "http://localhost:5000/api/sports/dashboard?refreshLive=true"
# Clears only live cache, keeps upcoming cached
```

**Test 3: Force Full Refresh (Not Recommended for Users)**
```bash
curl "http://localhost:5000/api/sports/dashboard?refresh=true"
# Clears ALL caches (live + upcoming)
```

#### Using Postman

1. Import `Syncender-Sports-API.postman_collection.json`
2. Create these requests:

**Request 1: Normal Dashboard**
```
GET http://localhost:5000/api/sports/dashboard
```

**Request 2: Refresh Live Only**
```
GET http://localhost:5000/api/sports/dashboard?refreshLive=true
```

**Request 3: Force Full Refresh**
```
GET http://localhost:5000/api/sports/dashboard?refresh=true
```

### 3. Backend Console Logs

Watch for these messages to verify cache behavior:

#### Cache Miss (First Request)
```
🔄 NFL: Fetching fresh data from API
🔄 NBA: Fetching fresh data from API
🔄 EPL: Fetching fresh data from API
🔄 UCL: Fetching fresh data from API
```

#### Cache Hit (Within 10s)
```
📦 NFL: Using cached data
📦 NBA: Using cached data
📦 EPL: Using cached data
📦 UCL: Using cached data
```

#### Live Expired, Upcoming Valid (11-59s)
```
🔄 NFL: Fetching fresh data from API (live expired)
```
**Note**: No "(upcoming expired)" message means upcoming cache is still valid!

#### Both Expired (After 60s)
```
🔄 NFL: Fetching fresh data from API (live expired) (upcoming expired)
```

#### Refresh Live Button Clicked
```
🔄 Live refresh requested - clearing live match cache only
🔄 NFL: Fetching fresh data from API (live expired)
📦 Cricket: Getting matches from MEMORY CACHE (no DB/API call)
```

## Cache Statistics Endpoint

Add this to `sportsController.js` for debugging:

```javascript
exports.getCacheStats = async (req, res) => {
  const sportsCacheService = require('../services/sportsCacheService');
  res.json(sportsCacheService.getCacheStats());
};
```

Add route in `sportsRoutes.js`:
```javascript
router.get('/cache/stats', sportsController.getCacheStats);
```

Test:
```bash
curl http://localhost:5000/api/sports/cache/stats
```

Expected output:
```json
{
  "nfl": {
    "live": {
      "cached": true,
      "age": 5234,      // milliseconds since cached
      "ttl": 10000,     // 10 seconds
      "valid": true
    },
    "upcoming": {
      "cached": true,
      "age": 5234,
      "ttl": 60000,     // 60 seconds
      "valid": true
    }
  },
  "nba": { /* same structure */ },
  "epl": { /* same structure */ },
  "ucl": { /* same structure */ }
}
```

## Expected Behavior Scenarios

### Scenario 1: User navigates between pages quickly
```
Time  Action              Live Cache  Upcoming Cache  API Calls
────────────────────────────────────────────────────────────────
0:00  Dashboard loads     ✓ Stored    ✓ Stored        5 calls
0:05  → Matches page      ✓ Valid     ✓ Valid         0 calls ✅
0:08  → Dashboard         ✓ Valid     ✓ Valid         0 calls ✅
0:15  Refresh page        ✗ Expired   ✓ Valid         5 calls
0:20  → Matches page      ✓ Valid     ✓ Valid         0 calls ✅
```
**Result**: 5 API calls instead of 15 (67% reduction)

### Scenario 2: User watches live match, refreshes periodically
```
Time  Action              Live Cache  Upcoming Cache  API Calls
────────────────────────────────────────────────────────────────
0:00  Dashboard loads     ✓ Stored    ✓ Stored        5 calls
0:30  Click refresh       ✗ Cleared   ✓ Valid         5 calls
0:45  Click refresh       ✗ Cleared   ✓ Valid         5 calls
1:00  Click refresh       ✗ Cleared   ✓ Valid         5 calls
```
**Result**: Upcoming cache stays valid, only live data refetches

### Scenario 3: User browses after match ends (no live matches)
```
Time  Action              Live Cache  Upcoming Cache  API Calls
────────────────────────────────────────────────────────────────
0:00  Dashboard loads     ✓ Stored    ✓ Stored        5 calls
0:30  Refresh page        ✗ Expired   ✓ Valid         5 calls
0:45  Refresh page        ✗ Expired   ✓ Valid         5 calls
1:05  Refresh page        ✗ Expired   ✗ Expired       5 calls
```
**Result**: Even without live matches, live cache still expires (future-proof)

## Performance Metrics

### 1. Cache Hit Rate
```
Cache Hit Rate = (Cached Responses / Total Requests) × 100
Target: >70% for normal usage
```

**How to measure:**
- Count `📦 Using cached data` logs vs `🔄 Fetching fresh data` logs
- Ratio should be >70:30

### 2. Response Time
| Request Type | Response Time | Improvement |
|--------------|---------------|-------------|
| Cache Hit | <100ms | - |
| Live API Call | 1000-2000ms | **10-20x slower** |
| Both Caches Expired | 1500-2500ms | **15-25x slower** |

### 3. API Call Reduction
**Without Caching:**
- User loads dashboard 10 times in 5 minutes
- API calls: 10 loads × 5 sports = **50 calls**

**With Tiered Caching:**
- First load: 5 calls
- Subsequent loads (within 10s): 0 calls
- Loads after 11-60s: 5 calls (live only)
- Loads after 60s: 5 calls (both)
- Realistic usage: **~10-15 calls** (70-80% reduction)

## Troubleshooting

### Issue: Live cache not expiring after 10 seconds
**Check:**
1. Verify `LIVE_TTL = 10 * 1000` in `sportsCacheService.js`
2. Look for backend logs showing "(live expired)"
3. Check system time (server clock issues can break cache)

**Test:**
```bash
# Should see "live expired" after 12 seconds
curl http://localhost:5000/api/sports/dashboard
sleep 12
curl http://localhost:5000/api/sports/dashboard
```

### Issue: Upcoming cache expiring too soon
**Check:**
1. Verify `UPCOMING_TTL = 60 * 1000` in `sportsCacheService.js`
2. Look for "(upcoming expired)" - should NOT appear before 60s
3. Check if `clearCache()` is being called (clears both)

### Issue: Refresh button not working
**Check:**
1. Browser console for errors
2. Network tab shows `?refreshLive=true` parameter
3. Backend receives and logs "Live refresh requested"
4. Button has `onClick={() => window.dashboardRefreshLive()}`

**Fix:**
```javascript
// In Dashboard.jsx, verify this exists:
useEffect(() => {
  window.dashboardRefreshLive = () => {
    fetchSportsData(true); // true = refreshLiveOnly
  };
}, []);
```

### Issue: Too many API calls
**Diagnosis:**
1. Check cache hit rate (<50% is bad)
2. Look for `🔄 Fetching fresh data` appearing too often
3. Verify TTL values are correct

**Common causes:**
- Users spamming refresh button
- Cache not being stored (check logs)
- Server restarting frequently (cache is in-memory)

## Best Practices

### ✅ DO:
- Click refresh button when you want latest live scores
- Let cache expire naturally (auto-refresh)
- Monitor backend logs during development
- Test both live and upcoming cache separately
- Verify cache stats endpoint for debugging

### ❌ DON'T:
- Spam refresh button (<10s intervals)
- Use `?refresh=true` for user-facing features (clears all caches)
- Assume cricket uses same cache (it's separate)
- Change TTL values without understanding impact
- Clear both caches when only live needs refresh

## Cricket Cache (Separate System)

**Important**: Cricket has its own caching system, NOT affected by tiered cache:

```javascript
// Cricket cache is separate
Memory Cache TTL: 2 minutes
Database Cache: Permanent (matches >6hrs ago)
Refresh Button: Does NOT clear cricket cache
```

**Why separate?**
- Cricket API has stricter rate limits
- Matches last longer (need longer cache)
- Uses database for historical data

**Test cricket separately:**
```bash
# Cricket cache is independent
curl http://localhost:5000/api/sports/cricket/live-matches
```

## Testing Checklist

Before deploying, verify:

- [ ] Live cache expires after 10 seconds
- [ ] Upcoming cache expires after 60 seconds
- [ ] Both caches expire after 65 seconds
- [ ] Refresh button clears ONLY live cache
- [ ] Page navigation uses cache (within TTL)
- [ ] Backend logs show cache hit/miss correctly
- [ ] Cache stats endpoint returns valid data
- [ ] Cricket cache unaffected by refresh button
- [ ] Response time <100ms for cache hits
- [ ] Cache hit rate >70% for normal usage

## Advanced: Load Testing

Test with multiple concurrent users:

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/api/sports/dashboard

# Check results:
# - Requests per second should be high (>50/s with cache)
# - Time per request should be low (<100ms with cache)
```

Expected results:
- **With cache**: >100 requests/second
- **Without cache**: ~5-10 requests/second (limited by external APIs)
