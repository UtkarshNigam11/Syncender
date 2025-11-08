import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Snackbar,
  Avatar,
  alpha,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import {
  Star,
  StarBorder,
  Search,
  ArrowBack,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsCricket,
  Delete,
  Info,
  EmojiEvents,
  CalendarMonth,
  Check,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const Favourites = () => {
  const { token, getSubscription } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // UI State
  const [activeTab, setActiveTab] = useState(0); // 0 = My Favourites, 1 = Add Teams/Leagues
  const [step, setStep] = useState('sports'); // 'sports', 'leagues', 'teams'
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  
  // Data State
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favouriteTeams, setFavouriteTeams] = useState([]);
  const [favouriteLeagues, setFavouriteLeagues] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [favTeamsSearch, setFavTeamsSearch] = useState('');
  const [favLeaguesSearch, setFavLeaguesSearch] = useState('');

  const maxFavouriteTeams = subscription?.plan === 'pro' ? 7 : 2;
  const maxFavouriteLeagues = subscription?.plan === 'pro' ? 1 : 0;

  // Sports configuration with leagues
  const sportsConfig = [
    {
      id: 'cricket',
      name: 'Cricket',
      icon: <SportsCricket />,
      color: '#4CAF50',
      leagues: [
        { id: '4344', name: 'Indian Premier League (IPL)', code: 'ipl', country: '🇮🇳' },
        { id: '4424', name: 'Big Bash League (BBL)', code: 'bbl', country: '🇦🇺' },
        { id: '4425', name: 'Pakistan Super League (PSL)', code: 'psl', country: '🇵🇰' },
        { id: '4426', name: 'Caribbean Premier League (CPL)', code: 'cpl', country: '🏴‍☠️' },
        { id: '4430', name: 'SA20', code: 'sa20', country: '🇿🇦' },
        { id: 'icc', name: 'International Cricket (ICC)', code: 'icc', country: '🌍' },
      ]
    },
    {
      id: 'soccer',
      name: 'Soccer/Football',
      icon: <SportsSoccer />,
      color: '#009688',
      leagues: [
        { id: 'eng.1', name: 'Premier League (EPL)', code: 'eng.1', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        { id: 'uefa.champions', name: 'UEFA Champions League', code: 'uefa.champions', country: '🇪🇺' },
        { id: 'esp.1', name: 'La Liga', code: 'esp.1', country: '🇪🇸' },
        { id: 'ger.1', name: 'Bundesliga', code: 'ger.1', country: '🇩🇪' },
        { id: 'ita.1', name: 'Serie A', code: 'ita.1', country: '🇮🇹' },
        { id: 'fra.1', name: 'Ligue 1', code: 'fra.1', country: '🇫🇷' },
      ]
    },
    {
      id: 'nfl',
      name: 'NFL (American Football)',
      icon: <SportsFootball />,
      color: '#0066CC',
      leagues: [
        { id: 'nfl', name: 'National Football League', code: 'nfl', country: '🇺🇸' }
      ]
    },
    {
      id: 'nba',
      name: 'NBA (Basketball)',
      icon: <SportsBasketball />,
      color: '#FF6B00',
      leagues: [
        { id: 'nba', name: 'National Basketball Association', code: 'nba', country: '🇺🇸' }
      ]
    },
  ];

  // Load subscription and favourites on mount
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      
      try {
        const sub = await getSubscription();
        setSubscription(sub);

        // Fetch user's favourites from new API
        const res = await axios.get('/api/favourites/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavouriteTeams(res.data.data?.teams || []);
        setFavouriteLeagues(res.data.data?.leagues || []);
      } catch (err) {
        console.error('Error loading favourites:', err);
        console.error('Error response:', err.response?.status, err.response?.data);
        
        if (err.response?.status === 401) {
          setSnackbar({ open: true, message: 'Please login to view favourites', severity: 'warning' });
        } else {
          setSnackbar({ open: true, message: 'Failed to load favourites', severity: 'error' });
        }
      }
    };
    loadData();
  }, [token, getSubscription]);

  // Fetch teams for selected league
  const fetchTeamsForLeague = async (sport, league) => {
    setLoading(true);
    try {
      let url = '';
      if (sport.id === 'cricket') {
        url = `http://localhost:5000/api/sports/teams/cricket?league=${league.code}`;
      } else if (sport.id === 'soccer') {
        url = `http://localhost:5000/api/sports/teams/soccer?league=${league.code}`;
      } else if (sport.id === 'nfl') {
        url = `http://localhost:5000/api/sports/teams/nfl`;
      } else if (sport.id === 'nba') {
        url = `http://localhost:5000/api/sports/teams/nba`;
      }
      
      const res = await axios.get(url);
      const normalizedTeams = res.data?.data || [];
      setTeams(normalizedTeams);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setSnackbar({ open: true, message: 'Failed to load teams. Please try again.', severity: 'error' });
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle sport selection
  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    if (sport.leagues.length === 1) {
      setSelectedLeague(sport.leagues[0]);
      fetchTeamsForLeague(sport, sport.leagues[0]);
      setStep('teams');
    } else {
      setStep('leagues');
    }
  };

  // Handle league selection
  const handleLeagueSelect = (league) => {
    setSelectedLeague(league);
    fetchTeamsForLeague(selectedSport, league);
    setStep('teams');
  };

  // Handle back button
  const handleBack = () => {
    setSearchTerm('');
    if (step === 'teams') {
      if (selectedSport.leagues.length === 1) {
        setStep('sports');
        setSelectedSport(null);
        setSelectedLeague(null);
      } else {
        setStep('leagues');
        setSelectedLeague(null);
      }
      setTeams([]);
    } else if (step === 'leagues') {
      setStep('sports');
      setSelectedSport(null);
    }
  };

  // Toggle team favourite
  const toggleTeamFavourite = async (team) => {
    if (!token) {
      setSnackbar({ open: true, message: 'Please login to add favourite teams', severity: 'warning' });
      return;
    }

    const isFavourite = favouriteTeams.some(t => t.teamId === team.id && t.sport === selectedSport.id);
    
    if (!isFavourite && favouriteTeams.length >= maxFavouriteTeams) {
      setSnackbar({ 
        open: true, 
        message: `You can only add up to ${maxFavouriteTeams} teams. ${subscription?.plan !== 'pro' ? 'Upgrade to Pro for more!' : ''}`, 
        severity: 'warning' 
      });
      return;
    }

    try {
      if (isFavourite) {
        // Remove team
        await axios.delete(`/api/favourites/teams/${team.id}?sport=${selectedSport.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavouriteTeams(favouriteTeams.filter(t => !(t.teamId === team.id && t.sport === selectedSport.id)));
        setSnackbar({ open: true, message: 'Team removed from favourites', severity: 'success' });
      } else {
        // Add team
        const res = await axios.post('/api/favourites/teams', {
          sport: selectedSport.id,
          league: selectedLeague?.code || '',
          teamId: team.id,
          name: team.name,
          shortName: team.shortName || team.abbreviation || team.name,
          logo: team.logo || ''
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavouriteTeams(res.data.data || []);
        setSnackbar({ 
          open: true, 
          message: 'Added to favourites', 
          severity: 'success' 
        });
      }
    } catch (err) {
      console.error('Error toggling favourite:', err);
      console.error('Error response:', err.response?.status, err.response?.data);
      
      const errorMsg = err.response?.data?.message || 'Failed to update favourites';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  // Toggle league favourite (Pro only)
  const toggleLeagueFavourite = async (league) => {
    if (!token) {
      setSnackbar({ open: true, message: 'Please login to add favourite leagues', severity: 'warning' });
      return;
    }

    if (subscription?.plan !== 'pro') {
      setSnackbar({ 
        open: true, 
        message: '🔒 League auto-sync is a Pro feature! Upgrade to sync entire leagues.', 
        severity: 'warning' 
      });
      navigate('/subscription');
      return;
    }

    const isFavourite = favouriteLeagues.some(l => l.league === league.code && l.sport === selectedSport.id);
    
    if (!isFavourite && favouriteLeagues.length >= maxFavouriteLeagues) {
      setSnackbar({ 
        open: true, 
        message: `You can only add up to ${maxFavouriteLeagues} league(s).`, 
        severity: 'warning' 
      });
      return;
    }

    try {
      if (isFavourite) {
        // Remove league
        await axios.delete(`/api/favourites/leagues/${league.code}?sport=${selectedSport.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavouriteLeagues(favouriteLeagues.filter(l => !(l.league === league.code && l.sport === selectedSport.id)));
        setSnackbar({ open: true, message: 'League removed from favourites', severity: 'success' });
      } else {
        // Add league
        const res = await axios.post('/api/favourites/leagues', {
          sport: selectedSport.id,
          league: league.code,
          name: league.name,
          logo: league.logo || ''
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavouriteLeagues(res.data.data || []);
        setSnackbar({ 
          open: true, 
          message: 'Added to favourites', 
          severity: 'success' 
        });
      }
    } catch (err) {
      console.error('Error toggling league favourite:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update favourites';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  // Remove team from favourites (from "My Favourites" tab)
  const removeFavouriteTeam = async (team) => {
    try {
      await axios.delete(`http://localhost:5000/api/favourites/teams/${team.teamId}?sport=${team.sport}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFavouriteTeams(favouriteTeams.filter(t => !(t.teamId === team.teamId && t.sport === team.sport)));
      setSnackbar({ open: true, message: 'Team removed from favourites', severity: 'success' });
    } catch (err) {
      console.error('Error removing team:', err);
      setSnackbar({ open: true, message: 'Failed to remove team', severity: 'error' });
    }
  };

  // Remove league from favourites (from "My Favourites" tab)
  const handleRemoveLeague = async (league) => {
    try {
      await axios.delete(`/api/favourites/leagues/${league.league}?sport=${league.sport}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFavouriteLeagues(favouriteLeagues.filter(l => !(l.league === league.league && l.sport === league.sport)));
      setSnackbar({ open: true, message: 'League removed from favourites', severity: 'success' });
    } catch (err) {
      console.error('Error removing league:', err);
      setSnackbar({ open: true, message: 'Failed to remove league', severity: 'error' });
    }
  };

  // Alias for removeFavouriteTeam (used in My Favourites tab)
  const handleRemoveTeam = removeFavouriteTeam;


  // Filtered teams based on search
  const filteredTeams = teams.filter(team =>
    (team.name || team.strTeam || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!token) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" action={
          <Button color="inherit" size="small" onClick={() => navigate('/login')}>
            Login
          </Button>
        }>
          Please login to manage your favourite teams and enable auto-sync.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 5,
          borderRadius: 4,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px -10px rgba(168, 237, 234, 0.4)',
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
            <Star 
              sx={{ 
                fontSize: 48, 
                color: 'white',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
              }} 
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900, 
                  color: 'white',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}
              >
                My Favourites
              </Typography>
              <Chip
                icon={<CalendarMonth sx={{ fontSize: 18 }} />}
                label="Auto-Sync"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 400,
                letterSpacing: '0.2px',
                textShadow: '0 1px 10px rgba(0,0,0,0.2)',
              }}
            >
              Your teams & matches sync automatically to Google Calendar
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Star />} iconPosition="start" label={`My Favourites (${favouriteTeams.length + favouriteLeagues.length})`} />
          <Tab icon={<Search />} iconPosition="start" label="Add Teams & Leagues" />
        </Tabs>
      </Paper>

      {/* Tab 1: My Favourites List */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Favourite Teams */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Favourite Teams
                  </Typography>
                  <Chip 
                    label={`${favouriteTeams.length}/${maxFavouriteTeams}`} 
                    color={favouriteTeams.length >= maxFavouriteTeams ? 'warning' : 'primary'}
                    size="small"
                  />
                </Box>

                {favouriteTeams.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No favourite teams yet
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => setActiveTab(1)}
                      startIcon={<Star />}
                    >
                      Add Teams
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {favouriteTeams.map((team, index) => (
                      <ListItem key={index} divider={index < favouriteTeams.length - 1}>
                        <ListItemAvatar>
                          <Avatar src={team.logo} sx={{ bgcolor: 'primary.main' }}>
                            {!team.logo && <Star />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={team.name}
                          secondary={`${team.sport?.toUpperCase()} • ${team.league || 'League'}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveTeam(team)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {subscription?.plan !== 'pro' && favouriteTeams.length >= 2 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Want more teams?</strong> Upgrade to Pro to follow up to 7 teams!
                    <Button size="small" onClick={() => navigate('/subscription')} sx={{ ml: 1 }}>
                      Upgrade
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Favourite Leagues (Pro Feature) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Favourite Leagues {subscription?.plan !== 'pro' && <Chip label="PRO" color="warning" size="small" sx={{ ml: 1 }} />}
                  </Typography>
                  <Chip 
                    label={`${favouriteLeagues.length}/${maxFavouriteLeagues}`} 
                    color={favouriteLeagues.length >= maxFavouriteLeagues ? 'warning' : 'secondary'}
                    size="small"
                  />
                </Box>

                {subscription?.plan !== 'pro' ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Auto-sync entire leagues with Pro
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="warning"
                      onClick={() => navigate('/subscription')}
                    >
                      Upgrade to Pro
                    </Button>
                  </Box>
                ) : favouriteLeagues.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No favourite leagues yet
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => setActiveTab(1)}
                      startIcon={<EmojiEvents />}
                    >
                      Add League
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {favouriteLeagues.map((league, index) => (
                      <ListItem key={index} divider={index < favouriteLeagues.length - 1}>
                        <ListItemAvatar>
                          <Avatar src={league.logo} sx={{ bgcolor: 'secondary.main' }}>
                            {!league.logo && <EmojiEvents />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={league.name}
                          secondary={`${league.sport?.toUpperCase()} • All matches auto-synced`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveLeague(league)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Add Teams & Leagues */}
      {activeTab === 1 && (
        <Box>
          {/* Unified Search - Works across all steps */}
          <TextField
            fullWidth
            placeholder={
              step === 'sports' ? "Search sports..." :
              step === 'leagues' ? "Search leagues..." :
              "Search teams..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Breadcrumb/Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            {step !== 'sports' && (
              <IconButton onClick={handleBack}>
                <ArrowBack />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {step === 'sports' && 'Select Sport'}
                {step === 'leagues' && `Select ${selectedSport?.name} League`}
                {step === 'teams' && `Select Teams from ${selectedLeague?.name}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step === 'sports' && 'Choose a sport to explore leagues and teams'}
                {step === 'leagues' && 'Pick a league to see available teams'}
                {step === 'teams' && `Selected teams will auto-sync to your calendar`}
              </Typography>
            </Box>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Step 1: Sports Selection */}
          {!loading && step === 'sports' && (
            <Grid container spacing={3}>
                {sportsConfig
                  .filter(sport => 
                    sport.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((sport) => (
                    <Grid item xs={12} sm={6} md={3} key={sport.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 40px ${alpha(sport.color, 0.3)}`,
                            borderColor: sport.color,
                          },
                          border: '2px solid',
                          borderColor: 'divider',
                        }}
                        onClick={() => handleSportSelect(sport)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: sport.color,
                              width: 64,
                              height: 64,
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            {sport.icon}
                          </Avatar>
                          <Typography variant="h6" gutterBottom>
                            {sport.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sport.leagues.length} {sport.leagues.length === 1 ? 'league' : 'leagues'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
          )}

          {/* Step 2: Leagues Selection */}
          {!loading && step === 'leagues' && selectedSport && (
            <Grid container spacing={3}>
                {selectedSport.leagues
                  .filter(league => 
                    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    league.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((league) => (
                    <Grid item xs={12} sm={6} md={4} key={league.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 40px ${alpha(selectedSport.color, 0.3)}`,
                            borderColor: selectedSport.color,
                          },
                          border: '2px solid',
                          borderColor: favouriteLeagues.includes(league.id) ? selectedSport.color : 'divider',
                          backgroundColor: favouriteLeagues.includes(league.id) ? alpha(selectedSport.color, 0.05) : 'background.paper',
                        }}
                        onClick={() => handleLeagueSelect(league)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6">
                              {league.country} {league.name}
                            </Typography>
                            <Tooltip title={subscription?.plan === 'pro' ? 'Add league to favourites' : 'Pro feature'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLeagueFavourite(league);
                                }}
                              >
                                {favouriteLeagues.some(l => l.league === league.code && l.sport === selectedSport.id) ? (
                                  <Star sx={{ color: 'warning.main' }} />
                                ) : (
                                  <StarBorder />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Click to view teams
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
            </Grid>
          )}

          {/* Step 3: Teams Selection */}
          {!loading && step === 'teams' && (
            <>
              <Grid container spacing={3}>
                {filteredTeams.map((team) => {
                  const isFavourite = favouriteTeams.some(t => t.teamId === team.id && t.sport === selectedSport.id);
                  const teamName = team.name || team.shortName || 'Unknown Team';
                  return (
                    <Grid item xs={12} sm={6} md={4} key={team.id}>
                      <Card sx={{ position: 'relative', height: '100%' }}>
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'background.paper' }
                          }}
                          onClick={() => toggleTeamFavourite(team)}
                        >
                          {isFavourite ? <Star color="warning" /> : <StarBorder />}
                        </IconButton>
                        <CardContent sx={{ pt: 6 }}>
                          {team.logo && (
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                              <img 
                                src={team.logo} 
                                alt={teamName}
                                style={{ maxWidth: 80, maxHeight: 80 }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" component="div" sx={{ mb: 0 }}>
                              {teamName}
                            </Typography>
                            {isFavourite && <Chip label="Favourite" size="small" color="warning" />}
                          </Box>
                          {team.location && (
                            <Typography variant="body2" color="text.secondary">
                              {team.location}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {filteredTeams.length === 0 && (
                <Alert severity="info">
                  No teams found{searchTerm && ` for "${searchTerm}"`}. Try adjusting your search.
                </Alert>
              )}
            </>
          )}
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Favourites;
