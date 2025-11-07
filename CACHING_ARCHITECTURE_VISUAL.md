# Caching Architecture - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐         │
│  │  Dashboard.jsx  │              │  Matches.jsx    │         │
│  │                 │              │                 │         │
│  │  [🔄] Refresh   │              │  [🔄] Refresh   │         │
│  │  (Live only)    │              │  (Live only)    │         │
│  └────────┬────────┘              └────────┬────────┘         │
│           │                                │                   │
└───────────┼────────────────────────────────┼───────────────────┘
            │                                │
            └────────────────┬───────────────┘
                             │
            GET /api/sports/dashboard?refreshLive=true
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         sportsController.js                               │ │
│  │                                                           │ │
│  │  1. Check query params:                                  │ │
│  │     • refreshLive=true → clearLiveCache()                │ │
│  │     • refresh=true → clearCache() (all)                  │ │
│  │     • no param → use cache if valid                      │ │
│  │                                                           │ │
│  │  2. Call sportsCacheService for each sport               │ │
│  │     • getNFLData()                                       │ │
│  │     • getNBAData()                                       │ │
│  │     • getEPLData()                                       │ │
│  │     • getUCLData()                                       │ │
│  │                                                           │ │
│  │  3. Call cricketCacheService (separate)                  │ │
│  │     • getCricketMatches()                                │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                      │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         sportsCacheService.js                             │ │
│  │                                                           │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐       │ │
│  │  │   liveCache         │  │  upcomingCache      │       │ │
│  │  │   TTL: 10 sec       │  │  TTL: 60 sec        │       │ │
│  │  ├─────────────────────┤  ├─────────────────────┤       │ │
│  │  │ nfl: { data, ts }   │  │ nfl: { data, ts }   │       │ │
│  │  │ nba: { data, ts }   │  │ nba: { data, ts }   │       │ │
│  │  │ epl: { data, ts }   │  │ epl: { data, ts }   │       │ │
│  │  │ ucl: { data, ts }   │  │ ucl: { data, ts }   │       │ │
│  │  └─────────────────────┘  └─────────────────────┘       │ │
│  │                                                           │ │
│  │  Functions:                                               │ │
│  │  • clearLiveCache() → clears left side only              │ │
│  │  • clearCache() → clears both sides                      │ │
│  │  • getNFLData(forceRefresh) → check cache, fetch if miss│ │
│  └───────────────────────┬───────────────────────────────────┘ │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ↓ (only on cache miss)
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SPORTS APIs                         │
│                                                                 │
│  • NFL API (sportsdata.io)                                     │
│  • NBA API (sportsdata.io)                                     │
│  • Soccer API (football-data.org)                              │
│  • Cricket API (separate service)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cache Flow Timeline

### Scenario 1: First Load
```
Time: 0s
┌─────────────┐
│ User clicks │
│  Dashboard  │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ Check liveCache      │ → Empty ✗
│ Check upcomingCache  │ → Empty ✗
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Fetch from APIs      │ → NFL, NBA, EPL, UCL
│ (1.5-2 seconds)      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Store in BOTH caches │
│ • liveCache[nfl]     │ = { data, timestamp: 0 }
│ • upcomingCache[nfl] │ = { data, timestamp: 0 }
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Return to user       │
│ (2000ms response)    │
└──────────────────────┘
```

### Scenario 2: Refresh Within 10 Seconds
```
Time: 5s
┌─────────────┐
│ User clicks │
│  Matches    │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ Check liveCache      │
│ age = 5s < 10s ✓     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Check upcomingCache  │
│ age = 5s < 60s ✓     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Return cached data   │
│ (50ms response)      │ ← 40x FASTER!
│ No API calls!        │
└──────────────────────┘
```

### Scenario 3: Refresh After 15 Seconds
```
Time: 15s
┌─────────────┐
│ User clicks │
│  Dashboard  │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ Check liveCache      │
│ age = 15s > 10s ✗    │ ← EXPIRED!
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Check upcomingCache  │
│ age = 15s < 60s ✓    │ ← Still valid!
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Fetch ONLY live data │ → API call
│ (1.5-2 seconds)      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Update liveCache     │ = { data, timestamp: 15000 }
│ Keep upcomingCache   │ = { data, timestamp: 0 } (unchanged)
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Return to user       │
│ (2000ms response)    │
└──────────────────────┘
```

### Scenario 4: Click Refresh Button
```
Time: 20s
┌─────────────┐
│ User clicks │
│ 🔄 Refresh  │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ Call clearLiveCache()│
│ liveCache = {}       │ ← Cleared!
│ upcomingCache = {}   │ ← Unchanged!
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Check liveCache      │ → Empty ✗ (just cleared)
│ Check upcomingCache  │ → age = 20s < 60s ✓
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Fetch ONLY live data │ → API call
│ (1.5-2 seconds)      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Update liveCache     │ = { data, timestamp: 20000 }
│ Keep upcomingCache   │ = { data, timestamp: 0 } (unchanged)
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Return fresh scores  │
│ (2000ms response)    │
└──────────────────────┘
```

---

## Cache Validation Logic

### getNFLData() Decision Tree
```
START
  │
  ├─ forceRefresh === true?
  │  ├─ YES → Fetch from API → Store in both caches → END
  │  │
  │  └─ NO → Check liveCache
  │         │
  │         ├─ Valid (age < 10s)?
  │         │  ├─ YES → Check upcomingCache
  │         │  │        │
  │         │  │        ├─ Valid (age < 60s)?
  │         │  │        │  ├─ YES → Return cached data → END
  │         │  │        │  └─ NO → Fetch from API → Store in both → END
  │         │  │
  │         │  └─ NO → Fetch from API → Store in both caches → END
  │         │
  │         └─ Not cached?
  │            └─ Fetch from API → Store in both caches → END
```

---

## Performance Comparison

### Without Caching (Every Request = API Call)
```
Request Timeline:
0s    ████████████████████ (2000ms) → Dashboard load
2s    ████████████████████ (2000ms) → Matches page
4s    ████████████████████ (2000ms) → Dashboard again
6s    ████████████████████ (2000ms) → Matches again

Total: 8 seconds, 20 API calls (5 per page × 4 loads)
```

### With Tiered Caching
```
Request Timeline:
0s    ████████████████████ (2000ms) → Dashboard load [API]
2s    ██ (50ms)                      → Matches page [CACHED]
4s    ██ (50ms)                      → Dashboard again [CACHED]
6s    ██ (50ms)                      → Matches again [CACHED]
11s   ████████████████████ (2000ms) → Refresh (live expired) [API]

Total: 4.15 seconds (48% faster), 10 API calls (50% reduction)
```

---

## Data Flow: Dashboard Load

```
┌───────────────────────────────────────────────────────────────┐
│                     User Loads Dashboard                      │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ↓                           ↓
        ┌───────────────┐           ┌───────────────┐
        │ getSportsData │           │ getCricketData│
        │  (tiered)     │           │  (separate)   │
        └───────┬───────┘           └───────┬───────┘
                │                           │
        ┌───────┴────────┐                  │
        ↓                ↓                  ↓
   ┌─────────┐     ┌──────────┐      ┌──────────┐
   │Live (10s)│     │Upcoming  │      │Cricket   │
   │  Cache  │     │ (60s)    │      │ (2min)   │
   └────┬────┘     └────┬─────┘      └────┬─────┘
        │               │                  │
        └───────┬───────┘                  │
                ↓                          ↓
        ┌───────────────┐          ┌─────────────┐
        │  NFL, NBA,    │          │  Cricket    │
        │  EPL, UCL     │          │  API        │
        │  APIs         │          │             │
        └───────┬───────┘          └──────┬──────┘
                │                         │
                └─────────┬───────────────┘
                          │
                          ↓
                ┌──────────────────┐
                │  Combine Results │
                │  Filter & Sort   │
                └────────┬─────────┘
                         │
                         ↓
                ┌─────────────────┐
                │  Return to UI   │
                │  • Live matches │
                │  • Upcoming     │
                │  • Completed    │
                └─────────────────┘
```

---

## Cache Invalidation Strategies

### Strategy 1: Time-Based Expiration (Current Implementation)
```
Pros:
✓ Simple to implement
✓ Predictable behavior
✓ No manual intervention needed
✓ Works well for time-sensitive data

Cons:
✗ May serve slightly stale data
✗ Fixed TTL (not adaptive)

Use Case: Perfect for sports scores (predictable change rate)
```

### Strategy 2: Event-Based Invalidation (Future Enhancement)
```
Pros:
✓ Always fresh data
✓ No wasted API calls
✓ Adapts to actual changes

Cons:
✗ Complex to implement
✗ Requires webhooks or polling
✗ May miss events

Use Case: Real-time dashboards, stock prices
```

### Strategy 3: Hybrid Approach (Recommended for Future)
```
Combine time-based + event-based:
• Short TTL during active games (10s)
• Long TTL when no games active (5min)
• Webhooks to invalidate on score changes

Benefits: Best of both worlds!
```

---

## Memory Usage Estimation

### Per Sport Cache (Approximate)
```
NFL Data:
• Live matches: ~5 games × 2KB = 10KB
• Upcoming matches: ~20 games × 1KB = 20KB
Total per sport: ~30KB

All Sports (NFL + NBA + EPL + UCL):
• liveCache: 4 sports × 10KB = 40KB
• upcomingCache: 4 sports × 20KB = 80KB
Total cache size: ~120KB

Cricket (separate):
• Memory cache: ~50KB
• Database cache: ~5MB (historical data)

Grand Total: ~5.2MB (negligible for modern servers)
```

### Scaling Considerations
```
10 concurrent users:    ~120KB (shared cache)
100 concurrent users:   ~120KB (shared cache)
1000 concurrent users:  ~120KB (shared cache)

Cache is shared across all users!
```

---

## Quick Reference

### Cache Timers
| Type | TTL | Reason |
|------|-----|--------|
| Live Matches | 10s | Scores change frequently |
| Upcoming Matches | 60s | Schedules rarely change |
| Cricket | 2min | API rate limits |

### Query Parameters
| Parameter | Effect | Use Case |
|-----------|--------|----------|
| None | Normal caching | Regular page loads |
| `refreshLive=true` | Clear live cache only | Refresh button |
| `refresh=true` | Clear all caches | Admin/debugging |

### Console Logs
| Symbol | Meaning |
|--------|---------|
| 📦 | Using cached data |
| 🔄 | Fetching from API |
| (live expired) | Live cache invalid, upcoming valid |
| (upcoming expired) | Both caches invalid |

---

## Architecture Benefits

### 1. Separation of Concerns
```
Frontend (React)
  ↓ (knows nothing about cache)
Controller (Express)
  ↓ (decides when to use cache)
Cache Service (Memory)
  ↓ (manages cache logic)
External APIs
```

### 2. Easy to Modify
```
Want longer cache? → Change TTL in one place
Want Redis? → Replace cache service, controller unchanged
Want per-user cache? → Add user ID to cache key
```

### 3. Testable
```
• Test cache service in isolation
• Test controller with mocked cache
• Test frontend with mocked API
Each layer independent!
```

---

This architecture provides a solid foundation that can scale from development to production! 🚀
