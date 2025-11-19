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
  SportsCricket,
  Schedule,
  Add,
  MoreVert,
  EventAvailable,
  Groups,
  Refresh,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [completedGames, setCompletedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({ 
    favoriteTeams: 0, 
    planLimit: 2, 
    eventsCount: 0,
    sportsAvailable: 6 
  });
  const [calendarStatus, setCalendarStatus] = useState({}); // Track calendar add status for each game
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's existing calendar events to check which matches are already added
  const fetchUserEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/events', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const events = response.data.events || [];
        
        // Create status map from backend event IDs
        const statusUpdates = {};
        events.forEach(event => {
          // Use the event's external IDs if available (already normalized in backend)
          if (event.externalIds?.matchId) {
            statusUpdates[event.externalIds.matchId] = 'added';
          }
          
          // Fallback: create simple identifier from teams
          if (event.teams?.home && event.teams?.away) {
            const simpleId = `${event.teams.away}-${event.teams.home}`.toLowerCase().replace(/\s+/g, '');
            statusUpdates[simpleId] = 'added';
          }
        });
        
        console.log('Dashboard: Loaded', events.length, 'events from calendar');
        setCalendarStatus(statusUpdates);
        
        // Update user stats with actual event count
        setUserStats(prev => ({ ...prev, eventsCount: events.length }));
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  // Function to add match to calendar
  const addToCalendar = async (game) => {
    // Create simple match identifier
    const gameId = `${game.awayTeam}-${game.homeTeam}`.toLowerCase().replace(/\s+/g, '');
    
    setCalendarStatus(prev => ({ ...prev, [gameId]: 'loading' }));
    
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
        },
        externalIds: {
          matchId: game.id // Store the backend-generated unique ID
        }
      };

      const token = localStorage.getItem('token');
      if (!token) {
          setCalendarStatus(prev => ({ ...prev, [gameId]: 'failed' }));
          navigate('/login');
          return;
      }

      const response = await axios.post('/api/events', eventData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.alreadyExists) {
        console.log('Event already exists in calendar');
      } else {
        console.log('Event added successfully');
      }
      
      setCalendarStatus(prev => ({ ...prev, [gameId]: 'added' }));
      await fetchUserEvents(); // Refresh event list
      
    } catch (error) {
      console.error('Error adding to calendar:', error);
      setCalendarStatus(prev => ({ ...prev, [gameId]: 'failed' }));
      
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.message?.includes('Google')) {
        navigate('/profile');
      }
    }
  };

  // Fetch real sports data
  useEffect(() => {
    // Fetch user stats for favorite teams
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const [userRes, subRes] = await Promise.all([
            axios.get('/api/users/me', {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get('/api/subscription', {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          const favoriteTeamsCount = userRes.data?.preferences?.favoriteTeams?.length || 0;
          const planLimit = subRes.data?.limits?.favoriteTeams || 2;
          setUserStats(prev => ({ 
            ...prev, 
            favoriteTeams: favoriteTeamsCount, 
            planLimit 
          }));
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };
    
    fetchUserStats();
    fetchUserEvents();
    
    // Fetch dashboard data from unified backend endpoint
    const fetchSportsData = async (refreshLiveOnly = false) => {
      try {
        if (refreshLiveOnly) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        
        // Add query param based on refresh type
        const url = refreshLiveOnly
          ? '/api/sports/dashboard?refreshLive=true'
          : '/api/sports/dashboard';
        
        const response = await axios.get(url);
        
        if (response.data.success) {
          const { liveGames, upcomingGames, completedGames } = response.data.data;
          
          setLiveGames(liveGames);
          setUpcomingGames(upcomingGames);
          setCompletedGames(completedGames || []);
          setError('');
          
          console.log(`✅ Dashboard loaded: ${liveGames.length} live, ${upcomingGames.length} upcoming, ${completedGames?.length || 0} completed`);
        }
      } catch (error) {
        console.error('Error fetching sports data:', error);
        setError('Unable to load live sports data. Please check if the backend server is running.');
        setLiveGames([]);
        setUpcomingGames([]);
        setCompletedGames([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchSportsData();
    
    // Expose refresh function for button
    window.dashboardRefreshLive = () => fetchSportsData(true);
  }, []);

  // Helper functions for sport icons and colors
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
      Soccer: '#00A86B',
      NFL: '#0066CC',
    };
    return colors[sport] || '#1976d2';
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
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f59e0b 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px -10px rgba(167, 139, 250, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            top: '-150px',
            right: '-50px',
            backdropFilter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            bottom: '-100px',
            left: '20%',
            backdropFilter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '50%',
            right: '15%',
            backdropFilter: 'blur(40px)',
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
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)',
            }}
          >
            <DashboardIcon 
              sx={{ 
                fontSize: 48, 
                color: 'white',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
              }} 
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                mb: 1,
                color: 'white',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}
            >
              Sports Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 400,
                letterSpacing: '0.2px',
                textShadow: '0 1px 10px rgba(0,0,0,0.2)',
              }}
            >
              Track ongoing matches, upcoming fixtures, and manage your sports calendar
            </Typography>
          </Box>
        </Box>
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
          <Grid container spacing={3} sx={{ mb: 4 }} columns={{ xs: 12, sm: 12, md: 15 }}>
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
                    {userStats.sportsAvailable}
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
                    {userStats.eventsCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Events Synced
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    View calendar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Favourite Teams Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/favourites')}
                sx={{
                  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                  color: 'white',
                  height: '180px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  borderRadius: 4,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(106, 17, 203, 0.4)',
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
                      <Groups sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {userStats.favoriteTeams}/{userStats.planLimit}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500, fontSize: '0.875rem' }}>
                    Favourite Teams
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    Auto-sync matches
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Ongoing Matches 
                  </Typography>
                  <IconButton
                    onClick={() => window.dashboardRefreshLive?.()}
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
                  <>
                    {liveGames.slice(0, 4).map((game) => (
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getSportColor(game.sport),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getSportIcon(game.sport)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {game.awayTeam} vs {game.homeTeam}
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
                        
                        {/* Live Score Display */}
                        {game.isLive && (game.homeScore || game.awayScore) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700,
                                color: 'text.primary',
                                minWidth: 30,
                                textAlign: 'center',
                              }}
                            >
                              {game.awayScore || 0}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                              -
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700,
                                color: 'text.primary',
                                minWidth: 30,
                                textAlign: 'center',
                              }}
                            >
                              {game.homeScore || 0}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  ))}

                  {/* See all live matches button */}
                  {liveGames.length > 0 && (
                    <Button 
                      variant="text" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/matches', { state: { initialTab: 0 } })}
                    >
                      See All Live Matches
                    </Button>
                  )}
                </>
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
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/matches')}
                >
                  View All
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingGames.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming games scheduled
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {upcomingGames.slice(0, 4).map((game) => (
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
                            {game.awayTeam} vs {game.homeTeam}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {game.date ? `${new Date(game.date).toLocaleDateString('en-GB')} • ${new Date(game.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {game.venue || 'Venue TBD'}
                          </Typography>
                        </Box>
                        {(() => {
                          // Simple identifier using game ID or team names
                          const gameId = game.id || `${game.awayTeam}-${game.homeTeam}`.toLowerCase().replace(/\s+/g, '');
                          const status = calendarStatus[gameId] || calendarStatus[`${game.awayTeam}-${game.homeTeam}`.toLowerCase().replace(/\s+/g, '')];
                          
                          if (status === 'added') {
                            return (
                              <Chip 
                                label="Added" 
                                color="success" 
                                size="small"
                                icon={<EventAvailable />}
                              />
                            );
                          } else if (status === 'failed') {
                            return (
                              <Chip 
                                label="Failed" 
                                color="error" 
                                size="small"
                              />
                            );
                          } else if (status === 'loading') {
                            return (
                              <Chip 
                                label="Adding..." 
                                size="small"
                              />
                            );
                          } else {
                            return (
                              <Button 
                                size="small" 
                                variant="outlined"
                                startIcon={<EventAvailable />}
                                onClick={() => addToCalendar(game)}
                              >
                                Add to Calendar
                              </Button>
                            );
                          }
                        })()}
                      </Box>
                    </Card>
                  ))}

                  {/* See all upcoming matches button */}
                  {upcomingGames.length > 0 && (
                    <Button 
                      variant="text" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/matches', { state: { initialTab: 2 } })}
                    >
                      See All Upcoming Matches
                    </Button>
                  )}
                </>
                )}

                {/* Removed "Explore More Sports" button as we now have "See All Upcoming Matches" */}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Results Section */}
        {completedGames && completedGames.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Recent Results
                  </Typography>
                  <Chip 
                    label={completedGames.length} 
                    color="default" 
                    size="small"
                  />
                </Box>

                <Grid container spacing={2}>
                  {completedGames.slice(0, 6).map((game) => (
                    <Grid item xs={12} sm={6} md={4} key={game.id}>
                      <Card 
                        sx={{ 
                          p: 2,
                          border: '2px solid',
                          borderColor: 'divider',
                          backgroundColor: alpha(getSportColor(game.sport), 0.02),
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: alpha(getSportColor(game.sport), 0.05),
                            borderColor: alpha(getSportColor(game.sport), 0.3),
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getSportColor(game.sport),
                              width: 28,
                              height: 28,
                            }}
                          >
                            {getSportIcon(game.sport)}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {game.league || game.sport} • Final
                          </Typography>
                        </Box>

                        {/* Teams and Scores */}
                        <Box sx={{ mb: 1.5 }}>
                          {/* Away Team */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {game.awayTeam}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: getSportColor(game.sport) }}>
                              {game.awayScore && game.awayScore !== '-' ? game.awayScore : '-'}
                            </Typography>
                          </Box>
                          
                          {/* Home Team */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {game.homeTeam}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: getSportColor(game.sport) }}>
                              {game.homeScore && game.homeScore !== '-' ? game.homeScore : '-'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Match Details */}
                        <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {game.date ? new Date(game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {game.venue || 'Venue TBD'}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* See all results button */}
                {completedGames.length > 6 && (
                  <Button 
                    variant="text" 
                    fullWidth 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/matches', { state: { initialTab: 3 } })}
                  >
                    See All Results
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
