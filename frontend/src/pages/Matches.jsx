import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  alpha,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsCricket,
  CalendarToday,
  PlayArrow,
  Schedule,
  MoreVert,
  Add,
  Star,
  StarBorder,
  Check,
  Refresh,
  Stadium,
} from '@mui/icons-material';

const Matches = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const { sportId, leagueCode, initialTab } = location.state || {};
  const [tabValue, setTabValue] = useState(initialTab !== undefined ? initialTab : 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState({
    live: [],
    today: [],
    upcoming: [],
    completed: [],
  });
  const [favorites, setFavorites] = useState(new Set());
  const [anchorEl, setAnchorEl] = useState(null);
  const [addingMatchId, setAddingMatchId] = useState(null);
  const [addedEvents, setAddedEvents] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async (refreshLiveOnly = false) => {
    try {
      if (refreshLiveOnly) {
        setRefreshing(true);
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Add query param based on refresh type
      const url = refreshLiveOnly
        ? 'http://localhost:5000/api/sports/dashboard?refreshLive=true'
        : 'http://localhost:5000/api/sports/dashboard';

      // Use the same unified dashboard API
      const response = await axios.get(url);
        
        if (response.data.success) {
          const { liveGames, upcomingGames, completedGames } = response.data.data;
          
          // Helper to format match data consistently
          const formatMatch = (game, isLive = false, category = '') => {
            const matchDate = new Date(game.date);
            const dateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = dateOnly.getTime() === todayDate.getTime();
            
            // Create unique ID by combining game ID with category to avoid duplicates
            const uniqueId = game.id 
              ? `${category}-${game.id}` 
              : `${category}-${game.sport}-${game.homeTeam}-${game.awayTeam}-${matchDate.getTime()}`;
            
            return {
              id: uniqueId,
              sport: game.sport,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              homeScore: game.homeScore || '-',
              awayScore: game.awayScore || '-',
              status: game.status || 'Scheduled',
              venue: game.venue || 'TBD',
              date: matchDate.toLocaleDateString('en-GB'), // DD/MM/YYYY
              time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              dateTime: matchDate, // For sorting
              league: game.league || game.sport,
              isLive: isLive,
              isToday: isToday,
              isUpcoming: !isLive && !isToday && dateOnly > todayDate,
              final: game.isFinal || false,
            };
          };

          // Format live games
          const formattedLive = liveGames.map(game => formatMatch(game, true, 'live'));
          
          // Format upcoming games (includes today and future)
          const formattedUpcoming = upcomingGames.map((game, index) => formatMatch(game, false, `upcoming-${index}`));
          
          // Format completed games (from database - last 3 days)
          const formattedCompleted = (completedGames || []).map((game, index) => formatMatch(game, false, `completed-${index}`));
          
          // Separate today's games from future games
          const todayGames = formattedUpcoming.filter(match => match.isToday);
          const futureGames = formattedUpcoming.filter(match => match.isUpcoming);
          
          // Sort all matches by start time
          const sortByTime = (a, b) => a.dateTime - b.dateTime;
          
          setMatches({
            live: formattedLive.sort(sortByTime),
            today: todayGames.sort(sortByTime),
            upcoming: futureGames.sort(sortByTime),
            completed: formattedCompleted.sort((a, b) => b.dateTime - a.dateTime), // Most recent first
          });
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        setMatches({
          live: [],
          today: [],
          upcoming: [],
          completed: [],
        });
      } finally {
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadMatches();
    fetchUserEvents();
    
    // Expose refresh function for button
    window.matchesRefreshLive = () => loadMatches(true);
  }, []);

  const fetchUserEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/events', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const events = response.data.events || [];
        
        // Create simple set of match identifiers
        const eventSet = new Set();
        events.forEach(event => {
          // Use external match ID if available
          if (event.externalIds?.matchId) {
            eventSet.add(event.externalIds.matchId);
          }
          
          // Fallback: create simple identifier from teams
          if (event.teams?.home && event.teams?.away) {
            const simpleId = `${event.teams.away}-${event.teams.home}`.toLowerCase().replace(/\s+/g, '');
            eventSet.add(simpleId);
          }
        });
        
        console.log('Matches: Loaded', events.length, 'events from calendar');
        setAddedEvents(eventSet);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const isEventAdded = (match) => {
    // Check using match ID first
    if (match.id && addedEvents.has(match.id)) {
      return true;
    }
    
    // Fallback: check using simple team identifier
    const simpleId = `${match.awayTeam}-${match.homeTeam}`.toLowerCase().replace(/\s+/g, '');
    return addedEvents.has(simpleId);
  };

  const getSportIcon = (sport) => {
    const icons = {
      Cricket: <SportsCricket />,
      NBA: <SportsBasketball />,
      Soccer: <SportsSoccer />,
      NFL: <SportsFootball />,
    };
    return icons[sport] || <SportsSoccer />;
  };

  const getSportColor = (sport) => {
    const colors = {
      Cricket: '#4CAF50',
      NBA: '#FF6B00',
      Soccer: '#009688',
      NFL: '#0066CC',
    };
    return colors[sport] || '#1976d2';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const toggleFavorite = (matchId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(matchId)) {
      newFavorites.delete(matchId);
    } else {
      newFavorites.add(matchId);
    }
    setFavorites(newFavorites);
  };

  const addToCalendar = async (match, calendarType = 'google') => {
    setAddingMatchId(match.id);
    try {
      // Parse date/time - backend will handle complex parsing
      const [day, month, year] = match.date.split('/');
      const dateStr = `${year}-${month}-${day}`;
      const startTime = new Date(`${dateStr}T${match.time || '19:00'}:00`);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

      const eventData = {
        title: `${match.awayTeam} vs ${match.homeTeam}`,
        description: `${match.sport} match at ${match.venue || 'TBD'}`,
        location: match.venue || 'TBD',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        sport: match.sport,
        teams: {
          home: match.homeTeam,
          away: match.awayTeam
        },
        externalIds: {
          matchId: match.id // Store the backend-generated unique ID
        }
      };

      const token = localStorage.getItem('token');
      
      if (!token && calendarType === 'google') {
        navigate('/login');
        return;
      }

      if (calendarType === 'apple') {
        // Download ICS file via backend or generate client-side
        const icsResponse = await axios.post('http://localhost:5000/api/apple/calendar', {
          summary: eventData.title,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: 'blob'
        });

        const blob = new Blob([icsResponse.data], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${match.awayTeam}_vs_${match.homeTeam}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Google Calendar
        const response = await axios.post('http://localhost:5000/api/events', eventData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log(response.data.alreadyExists ? 'Event already exists' : 'Event added successfully');
      }
      
      await fetchUserEvents(); // Refresh event list
    } catch (error) {
      console.error('Error adding to calendar:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.message?.includes('Google')) {
        navigate('/profile');
      }
    } finally {
      setAddingMatchId(null);
      fetchUserEvents();
    }
  };

  const getMatchesForTab = () => {
    const tabs = ['live', 'today', 'upcoming', 'completed'];
    const currentTab = tabs[tabValue];
    return matches[currentTab] || [];
  };

  const filteredMatches = getMatchesForTab().filter(match =>
    match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMatchCard = (match) => {
    // Determine if we should show action buttons (only for Today and Upcoming tabs)
    const showAddToCalendar = !match.isLive && !match.final;
    
    return (
      <Grid item xs={12} md={6} lg={4} key={match.id}>
        <Card
          sx={{
            height: '100%',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: match.isLive ? alpha(getSportColor(match.sport), 0.02) : 'background.paper',
            '&:hover': {
              borderColor: getSportColor(match.sport),
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: getSportColor(match.sport),
                    width: 32,
                    height: 32,
                  }}
                >
                  {getSportIcon(match.sport)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {match.sport}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {match.isLive && (
                  <Chip 
                    label="LIVE" 
                    size="small" 
                    sx={{ 
                      bgcolor: 'error.main', 
                      color: 'white',
                      fontSize: '0.7rem',
                      animation: 'pulse 2s infinite',
                    }} 
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => toggleFavorite(match.id)}
                >
                  {favorites.has(match.id) ? <Star color="warning" /> : <StarBorder />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>

            {/* Teams */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, textAlign: 'center', flexGrow: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: match.final && Number(match.awayScore) > Number(match.homeScore) ? 700 : 600,
                    color: match.final && Number(match.awayScore) < Number(match.homeScore) ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {match.awayTeam}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mx: 2 }}>
                vs
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: match.final && Number(match.homeScore) > Number(match.awayScore) ? 700 : 600,
                    color: match.final && Number(match.homeScore) < Number(match.awayScore) ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {match.homeTeam}
                </Typography>
              </Box>
            </Box>

            {/* Score for live matches */}
            {match.isLive && (match.homeScore || match.awayScore) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {match.awayScore || 0}
                </Typography>
                <Typography variant="h5" sx={{ mx: 2, color: 'text.secondary' }}>
                  -
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {match.homeScore || 0}
                </Typography>
              </Box>
            )}

            {/* Score for completed matches */}
            {match.final && (match.homeScore || match.awayScore) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: Number(match.awayScore) > Number(match.homeScore) ? 700 : 400,
                    color: Number(match.awayScore) < Number(match.homeScore) ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {match.awayScore || 0}
                </Typography>
                <Typography variant="h5" sx={{ mx: 2, color: 'text.secondary' }}>
                  -
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: Number(match.homeScore) > Number(match.awayScore) ? 700 : 400,
                    color: Number(match.homeScore) < Number(match.awayScore) ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {match.homeScore || 0}
                </Typography>
              </Box>
            )}

            {/* Match Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {match.venue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {match.isLive 
                  ? `Live` 
                  : match.final 
                    ? `Final - ${match.date}`
                    : `${match.time || ''} ${match.date}`
                }
              </Typography>
            </Box>

            {/* Actions - Only show for Today and Upcoming tabs */}
            {showAddToCalendar && (
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant={isEventAdded(match) ? "contained" : "outlined"}
                  size="small"
                  fullWidth
                  startIcon={isEventAdded(match) ? <Check /> : <CalendarToday />}
                  onClick={() => addToCalendar(match, 'google')}
                  disabled={addingMatchId === match.id || isEventAdded(match)}
                  sx={{
                    borderColor: getSportColor(match.sport),
                    color: isEventAdded(match) ? 'white' : getSportColor(match.sport),
                    backgroundColor: isEventAdded(match) ? getSportColor(match.sport) : 'transparent',
                    '&:hover': {
                      backgroundColor: isEventAdded(match) 
                        ? getSportColor(match.sport) 
                        : alpha(getSportColor(match.sport), 0.08),
                    },
                  }}
                >
                  {addingMatchId === match.id ? 'Adding...' : isEventAdded(match) ? 'Added' : 'Add to Calendar'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 5,
          borderRadius: 4,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #c21500 0%, #ffc500 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px -10px rgba(240, 147, 251, 0.5)',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-150px',
            right: '100px',
            backdropFilter: 'blur(20px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            bottom: '-80px',
            right: '-50px',
            backdropFilter: 'blur(20px)',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Stadium sx={{ fontSize: 48, color: 'white' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                mb: 1,
                color: 'white',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              }}
            >
              Matches
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 400,
                letterSpacing: '0.2px',
              }}
            >
              Follow live games, upcoming matches, and results
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Tabs */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            placeholder="Search teams, sports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab 
            icon={<PlayArrow />} 
            label={`Live (${matches.live?.length || 0})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<Schedule />} 
            label={`Today (${matches.today?.length || 0})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<CalendarToday />} 
            label={`Upcoming (${matches.upcoming?.length || 0})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<Star />} 
            label={`Results (${matches.completed?.length || 0})`} 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Matches Grid */}
      {tabValue === 0 && matches.live.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Live Matches
          </Typography>
          <IconButton
            onClick={() => window.matchesRefreshLive?.()}
            disabled={refreshing}
            size="small"
            sx={{
              bgcolor: refreshing ? 'action.disabledBackground' : 'primary.main',
              color: 'white',
              width: 32,
              height: 32,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' }
            }}
            title="Refresh live matches"
          >
            {refreshing ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : (
              <Refresh sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
      )}
      
      <Grid container spacing={3}>
        {filteredMatches.length > 0 ? (
          filteredMatches.map(renderMatchCard)
        ) : (
          <Grid item xs={12}>
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No matches found
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/sports')}
                startIcon={<Add />}
              >
                Explore Sports
              </Button>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>View Details</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Add to Calendar</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Set Reminder</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Share Match</MenuItem>
      </Menu>
    </Container>
  );
};

export default Matches;