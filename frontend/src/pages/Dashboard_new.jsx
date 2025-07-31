import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PlayArrow,
  MoreVert,
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    setLiveGames([
      {
        id: 1,
        sport: 'NBA',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        homeScore: 98,
        awayScore: 102,
        quarter: '4th',
        time: '2:15',
        isLive: true,
      },
      {
        id: 2,
        sport: 'NFL',
        homeTeam: 'Cowboys',
        awayTeam: 'Giants',
        homeScore: 21,
        awayScore: 14,
        quarter: '3rd',
        time: '8:42',
        isLive: true,
      },
      {
        id: 3,
        sport: 'Cricket',
        homeTeam: 'India',
        awayTeam: 'Australia',
        homeScore: '287/6',
        awayScore: '45.2 overs',
        quarter: 'Live',
        time: '',
        isLive: true,
      },
    ]);

    setUpcomingGames([
      {
        id: 4,
        sport: 'NBA',
        homeTeam: 'Heat',
        awayTeam: 'Celtics',
        date: 'Today, 8:00 PM',
        venue: 'Madison Square Garden',
      },
      {
        id: 5,
        sport: 'MLB',
        homeTeam: 'Yankees',
        awayTeam: 'Red Sox',
        date: 'Tomorrow, 7:30 PM',
        venue: 'Yankee Stadium',
      },
    ]);
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening in sports today
        </Typography>
      </Box>

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
                    42
                  </Typography>
                  <Typography variant="body2">Events Added</Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    12
                  </Typography>
                  <Typography variant="body2">Live Games</Typography>
                </Box>
                <PlayArrow sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    8
                  </Typography>
                  <Typography variant="body2">Sports Tracked</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    24
                  </Typography>
                  <Typography variant="body2">This Week</Typography>
                </Box>
                <Add sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Live Games */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Live Games 🔴
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
                {liveGames.map((game) => (
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
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {game.sport} • {game.quarter} {game.time}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {game.awayScore} - {game.homeScore}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => {/* Add to calendar */}}
                          sx={{ 
                            backgroundColor: getSportColor(game.sport),
                            '&:hover': {
                              backgroundColor: getSportColor(game.sport),
                              opacity: 0.8,
                            },
                          }}
                        >
                          Add to Calendar
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Games */}
        <Grid item xs={12} lg={4}>
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
                {upcomingGames.map((game) => (
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
                          {game.date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {game.venue}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => {/* Add to calendar */}}
                      >
                        Add
                      </Button>
                    </Box>
                  </Card>
                ))}

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
    </Container>
  );
};

export default Dashboard;
