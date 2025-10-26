import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  SportsHockey as Cricket,
  Schedule,
  Add,
  MoreVert,
  EventAvailable,
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetchedData = useRef(false);

  // Function to add match to calendar
  const addToCalendar = async (game) => {
    try {
      const startTime = new Date(game.date);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours later

      const eventData = {
        title: `${game.awayTeam} vs ${game.homeTeam}`,
        description: `${game.sport} match - ${game.league || game.sport}`,
        location: game.venue || 'TBD',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        sport: game.sport,
        teams: {
          home: game.homeTeam,
          away: game.awayTeam
        }
      };

      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      if (!token) {
          alert('Please login to add events to your calendar.');
          navigate('/login');
          return;
      }

      await axios.post('http://localhost:5000/api/events', eventData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      alert('Match added to your Google Calendar!');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      if (error.response && error.response.status === 401) {
        alert('Your session has expired or you are not authorized. Please log in again.');
        navigate('/login');
      } else if (error.response && error.response.data.message && error.response.data.message.includes('Google')) {
        alert('Please connect your Google account from your profile to add events to Google Calendar.');
        navigate('/profile');
      }
      else {
        alert('Failed to add match to calendar.');
      }
    }
  };

  // Fetch real sports data
  useEffect(() => {
    // If not SPA navigation (i.e., full page reload), clear cache and fetch fresh data
    if (!sessionStorage.getItem('dashboard_spa_nav')) {
      localStorage.removeItem('dashboard_liveGames');
      localStorage.removeItem('dashboard_upcomingGames');
    }
    // If SPA navigation, use cache
    const spaNav = sessionStorage.getItem('dashboard_spa_nav');
    const cachedLiveGames = localStorage.getItem('dashboard_liveGames');
    const cachedUpcomingGames = localStorage.getItem('dashboard_upcomingGames');
    if (spaNav && cachedLiveGames && cachedUpcomingGames) {
      setLiveGames(JSON.parse(cachedLiveGames));
      setUpcomingGames(JSON.parse(cachedUpcomingGames));
      setLoading(false);
      return;
    }
    
    // Fetch fresh data
    const fetchSportsData = async () => {
      try {
        setLoading(true);
        
        // Fetch multiple sports in parallel for better coverage
        const [
          nflResponse,
          nbaResponse,
          eplResponse,
          uclResponse,
          cricketResponse
        ] = await Promise.all([
          axios.get('http://localhost:5000/api/sports/scores/nfl'),
          axios.get('http://localhost:5000/api/sports/scores/nba'),
          axios.get('http://localhost:5000/api/sports/scores/soccer/eng.1'), // English Premier League
          axios.get('http://localhost:5000/api/sports/scores/soccer/uefa.champions'), // UEFA Champions League
          axios.get('http://localhost:5000/api/sports/cricket/matches')
        ]);

        // --- BEGIN: Unified all-sports logic ---
        const cricketMatchesRaw = cricketResponse.data?.matches || cricketResponse.data?.data || [];
        
        // Helper to check if a match is live
        const isCricketLive = (event) => {
          const status = (event.strStatus || event.status || '').toLowerCase();
          return status.includes('live') || status.includes('in progress') || status.includes('inplay') || status.includes('running');
        };
        
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        function extractMatchesFromApi(data, sportName, leagueOverride) {
          if (!data) return [];
          // NFL/ESPN style
          if (Array.isArray(data.events)) {
            return data.events.map((event, index) => {
              const eventDate = new Date(event.date);
              const state = event.status?.type?.state;
              const statusName = event.status?.type?.name;
              
              // More comprehensive live game detection
              const isLive = state === 'in' || state === 'live' || state === 'inprogress' || 
                           statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_LIVE';
              
              // More flexible upcoming game detection
              // Games that are scheduled/pre-game within next 7 days
              const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              const isScheduled = state === 'pre' || statusName === 'STATUS_SCHEDULED';
              const isUpcoming = (isScheduled && eventDate >= now && eventDate <= sevenDaysLater) || 
                               (eventDate >= now && eventDate <= threeDaysLater && !isLive && state !== 'post');
              
              const leagueName = leagueOverride || (data?.leagues?.[0]?.name) || event.league?.name || sportName;
              return {
                id: `${sportName}-${leagueName}-${index}`,
                sport: sportName,
                homeTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'Home Team',
                awayTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'Away Team',
                homeScore: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.score || '0',
                awayScore: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.score || '0',
                status: event.status?.type?.description || 'Scheduled',
                venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
                isLive,
                isUpcoming,
                date: event.date,
                time: undefined,
                league: leagueName,
              };
            });
          }
          // Cricket/SportsDB style
          if (Array.isArray(data)) {
            return data.map((event, index) => {
              const matchDate = event.dateEvent ? new Date(event.dateEvent + (event.strTime ? 'T' + event.strTime : '')) : null;
              const isLive = isCricketLive(event);
              const isUpcoming = matchDate && matchDate >= now && matchDate <= threeDaysLater && !isLive;
              return {
                id: `${sportName}-${event.strLeague || sportName}-${index}`,
                sport: sportName,
                homeTeam: event.strHomeTeam || event.team1 || 'Home Team',
                awayTeam: event.strAwayTeam || event.team2 || 'Away Team',
                status: event.strStatus || event.status || 'Scheduled',
                venue: event.strVenue || 'TBD',
                date: event.dateEvent,
                time: event.strTime,
                league: event.strLeague || event.leagueInfo?.name || sportName,
                isLive,
                isUpcoming,
              };
            });
          }
          return [];
        }
        
        // Collect all sports data here (add more as needed)
        let allMatches = [];
        allMatches = allMatches.concat(extractMatchesFromApi(nflResponse.data.data, 'NFL'));
        allMatches = allMatches.concat(extractMatchesFromApi(nbaResponse.data.data, 'NBA'));
        allMatches = allMatches.concat(extractMatchesFromApi(eplResponse.data.data, 'Soccer', eplResponse.data.league || 'English Premier League'));
        allMatches = allMatches.concat(extractMatchesFromApi(uclResponse.data.data, 'Soccer', uclResponse.data.league || 'UEFA Champions League'));
        allMatches = allMatches.concat(extractMatchesFromApi(cricketMatchesRaw, 'Cricket'));
        // TODO: Add more sports here as you add more APIs
        
        // Filter for live and upcoming (within 3 days)
        const live = allMatches.filter(g => g.isLive);
        const upcoming = allMatches.filter(g => g.isUpcoming)
          .sort((a, b) => {
            const aDate = new Date(a.date + (a.time ? 'T' + a.time : ''));
            const bDate = new Date(b.date + (b.time ? 'T' + b.time : ''));
            return aDate - bDate;
          })
          .slice(0, 3);
          
        setLiveGames(live);
        setUpcomingGames(upcoming);
        setError('');
        
        // Cache the data
        localStorage.setItem('dashboard_liveGames', JSON.stringify(live));
        localStorage.setItem('dashboard_upcomingGames', JSON.stringify(upcoming));
        sessionStorage.setItem('dashboard_spa_nav', 'true');
        // --- END: Unified all-sports logic ---
      } catch (error) {
        console.error('Error fetching sports data:', error);
        setError('Unable to load live sports data. Please check if the backend server is running.');
        setLiveGames([]);
        setUpcomingGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSportsData();
    hasFetchedData.current = true;
  }, []);

  // Helper functions for sport icons and colors
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
      Soccer: '#00A86B',
    };
    return colors[sport] || '#1976d2';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Sports Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track ongoing matches, upcoming fixtures, and manage your sports calendar
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Ongoing Matches Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => {
                  if (liveGames.length > 0) {
                    // Scroll to ongoing matches section
                    document.getElementById('ongoing-matches-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  height: '180px',
                  cursor: liveGames.length > 0 ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)',
                  },
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 28 }} />
                    </Box>
                    {liveGames.length > 0 && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: '#ff4444',
                          animation: 'pulse 2s infinite',
                          boxShadow: '0 0 0 0 rgba(255, 68, 68, 1)',
                          '@keyframes pulse': {
                            '0%': {
                              boxShadow: '0 0 0 0 rgba(255, 68, 68, 0.7)',
                            },
                            '70%': {
                              boxShadow: '0 0 0 10px rgba(255, 68, 68, 0)',
                            },
                            '100%': {
                              boxShadow: '0 0 0 0 rgba(255, 68, 68, 0)',
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {liveGames.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Ongoing Matches
                  </Typography>
                  {liveGames.length > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                      Click to view live games
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Matches Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => {
                  if (upcomingGames.length > 0) {
                    document.getElementById('upcoming-matches-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  height: '180px',
                  cursor: upcomingGames.length > 0 ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '&:hover': {
                    transform: upcomingGames.length > 0 ? 'translateY(-8px)' : 'none',
                    boxShadow: upcomingGames.length > 0 ? '0 12px 40px rgba(240, 147, 251, 0.4)' : 'none',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)',
                  },
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Schedule sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {upcomingGames.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Upcoming Matches
                  </Typography>
                  {upcomingGames.length > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                      Next 3 days
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sports Tracked Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/sports')}
                sx={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  height: '180px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(79, 172, 254, 0.4)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)',
                  },
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SportsSoccer sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    6
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Sports Available
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    Browse all sports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Calendar Events Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/calendar')}
                sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  height: '180px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(250, 112, 154, 0.4)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(50%, -50%)',
                  },
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EventAvailable sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {upcomingGames.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Calendar Events
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    View your calendar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      <Grid container spacing={3}>
        {/* Ongoing Matches */}
        <Grid item xs={12} lg={6} id="ongoing-matches-section">
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Ongoing Matches 
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/matches')}
                >
                  View All
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {liveGames.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No ongoing matches at the moment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check upcoming games or explore sports leagues
                    </Typography>
                  </Box>
                ) : (
                  liveGames.map((game) => (
                    <Card 
                      key={game.id}
                      sx={{ 
                        p: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                        backgroundColor: alpha(getSportColor(game.sport), 0.02),
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(getSportColor(game.sport), 0.08),
                          borderColor: alpha(getSportColor(game.sport), 0.4),
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${alpha(getSportColor(game.sport), 0.25)}`,
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(getSportColor(game.sport), 0.15)}, transparent)`,
                          transition: 'left 0.5s ease',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getSportColor(game.sport),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getSportIcon(game.sport)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {game.awayTeam} @ {game.homeTeam}
                              </Typography>
                              {game.isLive && (
                                <Chip 
                                  label="LIVE" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: 'error.main', 
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                  }} 
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {game.sport} • {game.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {game.venue || 'Venue TBD'} • {game.league || game.sport}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<EventAvailable />}
                            onClick={() => addToCalendar(game)}
                            sx={{ mb: 1 }}
                          >
                            Add to Calendar
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Games */}
        <Grid item xs={12} lg={6} id="upcoming-matches-section">
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Upcoming
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingGames.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming games scheduled
                    </Typography>
                  </Box>
                ) : (
                  upcomingGames.map((game) => (
                    <Card 
                      key={game.id}
                      sx={{ 
                        p: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                        backgroundColor: alpha(getSportColor(game.sport), 0.02),
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(getSportColor(game.sport), 0.08),
                          borderColor: alpha(getSportColor(game.sport), 0.4),
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${alpha(getSportColor(game.sport), 0.25)}`,
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(getSportColor(game.sport), 0.15)}, transparent)`,
                          transition: 'left 0.5s ease',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getSportColor(game.sport),
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getSportIcon(game.sport)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {game.awayTeam} @ {game.homeTeam}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {game.date ? new Date(game.date).toLocaleDateString() : 'TBD'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {game.venue || 'Venue TBD'}
                          </Typography>
                        </Box>
                        <Button 
                          size="small" 
                          variant="outlined"
                          startIcon={<EventAvailable />}
                          onClick={() => addToCalendar(game)}
                        >
                          Add to Calendar
                        </Button>
                      </Box>
                    </Card>
                  ))
                )}

                <Button 
                  variant="text" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/sports')}
                >
                  Explore More Sports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
