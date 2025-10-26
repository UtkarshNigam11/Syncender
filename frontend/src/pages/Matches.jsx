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
} from '@mui/material';
import {
  Search as SearchIcon,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  SportsHockey as Cricket,
  CalendarToday,
  PlayArrow,
  Schedule,
  MoreVert,
  Add,
  Star,
  StarBorder,
} from '@mui/icons-material';

const Matches = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const { sportId, leagueCode } = location.state || {};
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState({
    live: [],
    today: [],
    upcoming: [],
    completed: [],
  });
  const [favorites, setFavorites] = useState(new Set());
  const [anchorEl, setAnchorEl] = useState(null);
  const [calendarMenuEl, setCalendarMenuEl] = useState(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '19:00:00';
    
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Helper to check if a match is live
        const isCricketLive = (event) => {
          const status = (event.strStatus || event.status || '').toLowerCase();
          return status.includes('live') || status.includes('in progress') || status.includes('inplay') || status.includes('running');
        };

        // Helper to parse cricket match data
        const parseCricketMatch = (event, index) => {
          const matchDate = event.dateEvent ? new Date(event.dateEvent + (event.strTime ? 'T' + event.strTime : '')) : null;
          const isLive = isCricketLive(event);
          const dateOnly = matchDate ? new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate()) : null;
          const isToday = dateOnly && dateOnly.getTime() === today.getTime();
          const isUpcoming = dateOnly && dateOnly > today && dateOnly <= threeDaysLater && !isLive;
          const isCompleted = event.strStatus && (event.strStatus.toLowerCase().includes('finished') || event.strStatus.toLowerCase().includes('complete'));

          return {
            id: `cricket-${index}`,
            sport: 'Cricket',
            homeTeam: event.strHomeTeam || event.team1 || 'Home Team',
            awayTeam: event.strAwayTeam || event.team2 || 'Away Team',
            homeScore: event.intHomeScore || event.strHomeScore || '0',
            awayScore: event.intAwayScore || event.strAwayScore || '0',
            status: event.strStatus || event.status || 'Scheduled',
            venue: event.strVenue || 'TBD',
            date: event.dateEvent,
            time: event.strTime,
            league: event.strLeague || event.leagueInfo?.name || 'Cricket',
            isLive,
            isToday,
            isUpcoming,
            final: isCompleted,
          };
        };

        // Helper to parse ESPN-style events
        const parseESPNEvent = (event, sportName, index) => {
          const state = event.status?.type?.state;
          const statusName = event.status?.type?.name;
          const isLive = state === 'in' || state === 'live' || state === 'inprogress' || statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_LIVE';
          const isPost = state === 'post' || statusName === 'STATUS_FINAL' || statusName === 'STATUS_FULL_TIME';
          const dateISO = event.date;
          const date = new Date(dateISO);
          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const isToday = dateOnly.getTime() === today.getTime();
          const isUpcoming = dateOnly > today && dateOnly <= threeDaysLater && !isLive && !isPost;

          const competitors = event.competitions?.[0]?.competitors || [];
          const homeCompetitor = competitors.find(c => c.homeAway === 'home');
          const awayCompetitor = competitors.find(c => c.homeAway === 'away');

          return {
            id: `${sportName}-${index}`,
            sport: sportName,
            homeTeam: homeCompetitor?.team?.displayName || 'Home',
            awayTeam: awayCompetitor?.team?.displayName || 'Away',
            homeScore: homeCompetitor?.score || '0',
            awayScore: awayCompetitor?.score || '0',
            venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
            date: dateISO,
            time: undefined,
            isLive,
            isToday,
            isUpcoming,
            final: isPost,
          };
        };

        // Fetch all sports in parallel
        const [
          nflResponse,
          nbaResponse,
          eplResponse,
          uclResponse,
          cricketResponse
        ] = await Promise.all([
          axios.get('http://localhost:5000/api/sports/scores/nfl').catch(() => ({ data: { data: { events: [] } } })),
          axios.get('http://localhost:5000/api/sports/scores/nba').catch(() => ({ data: { data: { events: [] } } })),
          axios.get('http://localhost:5000/api/sports/scores/soccer/eng.1').catch(() => ({ data: { data: { events: [] } } })),
          axios.get('http://localhost:5000/api/sports/scores/soccer/uefa.champions').catch(() => ({ data: { data: { events: [] } } })),
          axios.get('http://localhost:5000/api/sports/cricket/matches').catch(() => ({ data: { matches: [] } }))
        ]);

        // Process all matches
        const allMatches = [];

        // NFL matches
        const nflEvents = nflResponse.data?.data?.events || [];
        nflEvents.forEach((event, i) => allMatches.push(parseESPNEvent(event, 'NFL', i)));

        // NBA matches
        const nbaEvents = nbaResponse.data?.data?.events || [];
        nbaEvents.forEach((event, i) => allMatches.push(parseESPNEvent(event, 'NBA', i)));

        // EPL matches
        const eplEvents = eplResponse.data?.data?.events || [];
        eplEvents.forEach((event, i) => allMatches.push(parseESPNEvent(event, 'Soccer', i)));

        // UCL matches
        const uclEvents = uclResponse.data?.data?.events || [];
        uclEvents.forEach((event, i) => allMatches.push(parseESPNEvent(event, 'Soccer', i + eplEvents.length)));

        // Cricket matches
        const cricketMatches = cricketResponse.data?.matches || cricketResponse.data?.data || [];
        cricketMatches.forEach((event, i) => allMatches.push(parseCricketMatch(event, i)));

        // Categorize matches
        const bucket = { live: [], today: [], upcoming: [], completed: [] };
        allMatches.forEach((match) => {
          if (match.isLive) {
            bucket.live.push(match);
          } else if (match.final) {
            bucket.completed.push(match);
          } else if (match.isToday) {
            bucket.today.push(match);
          } else if (match.isUpcoming) {
            bucket.upcoming.push(match);
          }
        });

        // Sort upcoming matches by date
        bucket.upcoming.sort((a, b) => {
          const aDate = new Date(a.date + (a.time ? 'T' + a.time : ''));
          const bDate = new Date(b.date + (b.time ? 'T' + b.time : ''));
          return aDate - bDate;
        });

        setMatches(bucket);
      } catch (e) {
        console.error('Failed to load matches:', e);
        setMatches({ live: [], today: [], upcoming: [], completed: [] });
      }
    };
    load();
  }, []);

  const getSportIcon = (sport) => {
    const icons = {
      NBA: <SportsBasketball />,
      NFL: <SportsFootball />,
      MLB: <SportsBaseball />,
      NHL: <SportsHockey />,
      Cricket: <Cricket />,
      Soccer: <SportsSoccer />,
    };
    return icons[sport] || <SportsSoccer />;
  };

  const getSportColor = (sport) => {
    const colors = {
      NBA: '#FF6B00',
      NFL: '#0066CC',
      MLB: '#CC0000',
      NHL: '#000080',
      Cricket: '#4CAF50',
      Soccer: '#009688',
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
    setIsAddingToCalendar(true);
    try {
      // Parse date and time more reliably
      let startTime;
      if (match.date === 'Today' || match.date === '2025-08-10') {
        // For today's matches, use current date with the specified time
        const today = new Date();
        if (match.time) {
          const [time, period] = match.time.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          if (period === 'PM' && hour24 !== 12) hour24 += 12;
          if (period === 'AM' && hour24 === 12) hour24 = 0;
          
          today.setHours(hour24, parseInt(minutes || 0), 0, 0);
          startTime = today;
        } else {
          startTime = new Date();
        }
      } else if (match.date.includes('-')) {
        // Format: YYYY-MM-DD
        if (match.time) {
          startTime = new Date(`${match.date}T${convertTo24Hour(match.time)}`);
        } else {
          startTime = new Date(`${match.date}T19:00:00`);
        }
      } else {
        // Handle other date formats or set default
        startTime = new Date();
        startTime.setHours(19, 0, 0, 0); // Default to 7 PM
      }

      // Estimate end time (3 hours after start for most sports)
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
        }
      };

      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      console.log('Token found:', !!token);
      console.log('Event data:', eventData);
      console.log('Calendar type:', calendarType);
      
      if (!token) {
        // For demo purposes, let's create a mock event locally
        const confirmed = confirm('You are not logged in. Would you like to:\n\n1. Click "OK" to go to Login page\n2. Click "Cancel" to download calendar file anyway (demo mode)');
        
        if (confirmed) {
          navigate('/login');
          return;
        } else {
          // Demo mode - just download the ICS file for Apple Calendar
          if (calendarType === 'google') {
            alert('Google Calendar requires login. Switching to Apple Calendar download...');
            calendarType = 'apple';
          }
          // Continue to Apple Calendar download without authentication
        }
      }

      if (calendarType === 'apple') {
        // For Apple Calendar, download ICS file
        if (token) {
          // Authenticated user - use backend API
          const response = await axios.post('http://localhost:5000/api/apple/calendar', {
            summary: eventData.title,
            description: eventData.description,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            responseType: 'blob'
          });

          // Create and trigger download
          const blob = new Blob([response.data], { type: 'text/calendar' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${match.awayTeam}_vs_${match.homeTeam}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          // Demo mode - generate ICS file client-side
          const generateICS = (eventData) => {
            const formatDate = (date) => {
              return new Date(date).toISOString().replace(/-|:|\./g, '').slice(0, 15) + 'Z';
            };
            
            const now = new Date();
            const uid = 'match-' + Date.now() + '@sportscalendar.com';
            
            return [
              'BEGIN:VCALENDAR',
              'VERSION:2.0',
              'PRODID:-//Sports Calendar Integration//EN',
              'CALSCALE:GREGORIAN',
              'METHOD:PUBLISH',
              'BEGIN:VEVENT',
              `UID:${uid}`,
              `DTSTAMP:${formatDate(now)}`,
              `DTSTART:${formatDate(eventData.startTime)}`,
              `DTEND:${formatDate(eventData.endTime)}`,
              `SUMMARY:${eventData.title}`,
              `DESCRIPTION:${eventData.description}`,
              `LOCATION:${eventData.location}`,
              'END:VEVENT',
              'END:VCALENDAR'
            ].join('\r\n');
          };
          
          const icsContent = generateICS(eventData);
          const blob = new Blob([icsContent], { type: 'text/calendar' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${match.awayTeam}_vs_${match.homeTeam}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
        
        alert('Calendar file downloaded! Open it to add to Apple Calendar.');
      } else {
        // For Google Calendar
        if (!token) {
          alert('Google Calendar requires authentication. Please login first or use Apple Calendar option.');
          return;
        }
        
        console.log('Sending to Google Calendar API:', eventData);
        const response = await axios.post('http://localhost:5000/api/events', eventData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Google Calendar response:', response.data);
        alert('Match added to your Google Calendar!');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response && error.response.status === 401) {
        alert('Your session has expired or you are not authorized. Please log in again.');
        navigate('/login');
      } else if (error.response && error.response.data.message) {
        if (error.response.data.message.includes('Google Calendar not connected')) {
          alert('Please connect your Google account from your profile to add events to Google Calendar.');
          navigate('/profile');
        } else {
          alert(`Error: ${error.response.data.message}`);
        }
      } else {
        alert(`Failed to add match to ${calendarType} calendar. Please try again.`);
      }
    } finally {
      setIsAddingToCalendar(false);
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
                    fontWeight: match.final && match.homeScore > match.awayScore ? 700 : 600,
                    color: match.final && match.homeScore < match.awayScore ? 'text.disabled' : 'text.primary',
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
                    fontWeight: match.final && match.awayScore > match.homeScore ? 700 : 600,
                    color: match.final && match.awayScore < match.homeScore ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {match.homeTeam}
                </Typography>
              </Box>
            </Box>

            {/* Score for completed matches */}
            {match.final && (match.homeScore || match.awayScore) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: match.homeScore > match.awayScore ? 700 : 400,
                    color: match.homeScore < match.awayScore ? 'text.disabled' : 'text.primary',
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
                    fontWeight: match.awayScore > match.homeScore ? 700 : 400,
                    color: match.awayScore < match.homeScore ? 'text.disabled' : 'text.primary',
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
                    : `${match.date} ${match.time || ''}`
                }
              </Typography>
            </Box>

            {/* Actions - Only show for Today and Upcoming tabs */}
            {showAddToCalendar && (
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<CalendarToday />}
                  onClick={(e) => setCalendarMenuEl(e.currentTarget)}
                  disabled={isAddingToCalendar}
                  sx={{
                    borderColor: getSportColor(match.sport),
                    color: getSportColor(match.sport),
                    '&:hover': {
                      backgroundColor: alpha(getSportColor(match.sport), 0.08),
                    },
                  }}
                >
                  {isAddingToCalendar ? 'Adding...' : 'Add to Calendar'}
                </Button>
                <Menu
                  anchorEl={calendarMenuEl}
                  open={Boolean(calendarMenuEl)}
                  onClose={() => setCalendarMenuEl(null)}
                >
                  <MenuItem onClick={() => {
                    addToCalendar(match, 'google');
                    setCalendarMenuEl(null);
                  }}>
                    Google Calendar
                  </MenuItem>
                  <MenuItem onClick={() => {
                    addToCalendar(match, 'apple');
                    setCalendarMenuEl(null);
                  }}>
                    Apple Calendar
                  </MenuItem>
                </Menu>
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Matches 🏟️
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow live games, upcoming matches, and results
        </Typography>
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