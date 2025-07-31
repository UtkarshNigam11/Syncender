import React, { useState, useEffect } from 'react';
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

  // Function to add match to calendar
  const addToCalendar = async (game) => {
    try {
      const eventData = {
        title: `${game.awayTeam} vs ${game.homeTeam}`,
        description: `${game.sport} match - ${game.league || game.sport}`,
        venue: game.venue || 'TBD',
        startDate: game.date,
        startTime: game.time || '10:00',
        sport: game.sport,
        teams: [game.homeTeam, game.awayTeam]
      };

      // You can implement Google Calendar integration here
      // For now, create a calendar file download
      const calendarEvent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sports Calendar//EN
BEGIN:VEVENT
SUMMARY:${eventData.title}
DTSTART:${eventData.startDate?.replace(/-/g, '')}T${eventData.startTime?.replace(/:/g, '')}00Z
DESCRIPTION:${eventData.description}
LOCATION:${eventData.venue}
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([calendarEvent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${game.awayTeam}_vs_${game.homeTeam}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Match added to calendar! Check your downloads folder.');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert('Failed to add match to calendar.');
    }
  };

  // Fetch real sports data
  useEffect(() => {
    const fetchSportsData = async () => {
      try {
        setLoading(true);
        
        // Fetch live NFL games
        const nflResponse = await axios.get('http://localhost:5000/api/sports/scores/nfl');
        
        // Fetch cricket matches  
        const cricketResponse = await axios.get('http://localhost:5000/api/sports/cricket/matches');
        
        // Process NFL data
        const nflGames = nflResponse.data.data?.events?.slice(0, 2).map((event, index) => ({
          id: `nfl-${index}`,
          sport: 'NFL',
          homeTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || 'Home Team',
          awayTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || 'Away Team',
          homeScore: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.score || '0',
          awayScore: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.score || '0',
          status: event.status?.type?.description || 'Scheduled',
          venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
          isLive: event.status?.type?.state === 'in',
          date: event.date,
        })) || [];


        // Major cricket leagues/events
        const majorLeagues = [
          'ICC Cricket World Cup',
          'ICC T20 World Cup',
          'ICC Champions Trophy',
          'ICC World Test Championship',
          'Indian Premier League',
          'Big Bash League',
          'Pakistan Super League',
          'Caribbean Premier League',
          'The Ashes',
          'Asia Cup',
          'Bangladesh Premier League',
          'SA20',
          'Lanka Premier League',
          'Vitality Blast',
          'Mzansi Super League',
          'Global T20 Canada',
          'Abu Dhabi T10',
          'The Hundred',
          'Super Smash',
          'Zimbabwe Domestic T20',
          'Afghanistan Premier League',
          'Euro T20 Slam',
          "Women's Big Bash League",
          "Women's T20 Challenge",
          "Women's Cricket World Cup",
          "Women's T20 World Cup",
        ];

        // Helper to check if a match is live
        const isCricketLive = (event) => {
          const status = (event.strStatus || event.status || '').toLowerCase();
          // Common live indicators
          const liveIndicators = ['live', 'in progress', 'ongoing', '1st innings', '2nd innings', 'stumps', 'lunch', 'tea', 'rain delay'];
          if (liveIndicators.some(ind => status.includes(ind))) return true;
          // Fallback: check if current time is between start and end (if available)
          if (event.dateEvent && event.strTime) {
            const start = new Date(`${event.dateEvent}T${event.strTime}`);
            const now = new Date();
            // Assume a match lasts up to 8 hours
            if (now >= start && now - start < 8 * 60 * 60 * 1000) return true;
          }
          return false;
        };

        // Filter and map cricket matches
        const cricketMatchesRaw = cricketResponse.data.matches || cricketResponse.data.data || [];
        const cricketGames = cricketMatchesRaw
          .filter(event => majorLeagues.some(league => (event.strLeague || event.league || '').toLowerCase().includes(league.toLowerCase())))
          .map((event, index) => ({
            id: `cricket-${index}`,
            sport: 'Cricket',
            homeTeam: event.strHomeTeam || event.team1 || 'Home Team',
            awayTeam: event.strAwayTeam || event.team2 || 'Away Team',
            status: event.strStatus || event.status || 'Scheduled',
            venue: event.strVenue || 'TBD',
            date: event.dateEvent,
            time: event.strTime,
            league: event.strLeague || event.leagueInfo?.name || 'Cricket',
            isLive: isCricketLive(event),
            isUpcoming: !isCricketLive(event) && new Date(event.dateEvent) > new Date(),
          }));

        setLiveGames([
          ...nflGames.filter(g => g.isLive),
          ...cricketGames.filter(g => g.isLive)
        ]);
        setUpcomingGames([
          ...nflGames.filter(g => !g.isLive),
          ...cricketGames.filter(g => !g.isLive)
        ].slice(0, 3));
        
      } catch (err) {
        console.error('Error fetching sports data:', err);
        setError('Unable to load live sports data. Please check if the backend server is running.');
        // Fallback to show no games message
        setLiveGames([]);
        setUpcomingGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSportsData();
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
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                        {liveGames.length}
                      </Typography>
                      <Typography variant="body2">Ongoing</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                        {upcomingGames.length}
                      </Typography>
                      <Typography variant="body2">Upcoming</Typography>
                    </Box>
                    <Schedule sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                        6
                      </Typography>
                      <Typography variant="body2">Sports</Typography>
                    </Box>
                    <SportsSoccer sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                        0
                      </Typography>
                      <Typography variant="body2">Calendar Events</Typography>
                    </Box>
                    <Add sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      <Grid container spacing={3}>
        {/* Ongoing Matches */}
        <Grid item xs={12} lg={6}>
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
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: alpha(getSportColor(game.sport), 0.02),
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: alpha(getSportColor(game.sport), 0.04),
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
        <Grid item xs={12} lg={6}>
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
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
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
