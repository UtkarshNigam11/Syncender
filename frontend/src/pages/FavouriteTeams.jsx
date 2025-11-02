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
} from '@mui/material';
import { Star, StarBorder, Search, ArrowBack, SportsSoccer, SportsBasketball, SportsFootball, SportsHockey } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const FavouriteTeams = () => {
  const { token, getSubscription } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState('sports'); // 'sports', 'leagues', 'teams'
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favouriteTeams, setFavouriteTeams] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');

  const maxFavourites = subscription?.plan === 'pro' ? 7 : 2;

  // Sports with their leagues
  const sportsConfig = [
    {
      id: 'cricket',
      name: 'Cricket',
      icon: <SportsHockey />,
      color: '#4CAF50',
      leagues: [
        { id: '4344', name: 'Indian Premier League (IPL)', code: 'ipl' },
        { id: '4424', name: 'Big Bash League (BBL)', code: 'bbl' },
        { id: '4425', name: 'Pakistan Super League (PSL)', code: 'psl' },
        { id: '4426', name: 'Caribbean Premier League (CPL)', code: 'cpl' },
        { id: '4430', name: 'SA20', code: 'sa20' },
        { id: 'icc', name: 'International Cricket (ICC)', code: 'icc' },
      ]
    },
    {
      id: 'soccer',
      name: 'Soccer/Football',
      icon: <SportsSoccer />,
      color: '#009688',
      leagues: [
        { id: 'eng.1', name: 'Premier League (EPL)', code: 'eng.1' },
        { id: 'uefa.champions', name: 'UEFA Champions League', code: 'uefa.champions' },
        { id: 'esp.1', name: 'La Liga', code: 'esp.1' },
        { id: 'ger.1', name: 'Bundesliga', code: 'ger.1' },
        { id: 'ita.1', name: 'Serie A', code: 'ita.1' },
        { id: 'fra.1', name: 'Ligue 1', code: 'fra.1' },
      ]
    },
    {
      id: 'nfl',
      name: 'NFL (American Football)',
      icon: <SportsFootball />,
      color: '#0066CC',
      leagues: [
        { id: 'nfl', name: 'National Football League', code: 'nfl' }
      ]
    },
    {
      id: 'nba',
      name: 'NBA (Basketball)',
      icon: <SportsBasketball />,
      color: '#FF6B00',
      leagues: [
        { id: 'nba', name: 'National Basketball Association', code: 'nba' }
      ]
    },
  ];

  useEffect(() => {
    const loadSubscription = async () => {
      if (token) {
        const sub = await getSubscription();
        setSubscription(sub);
      }
    };
    loadSubscription();
  }, [token]);

  useEffect(() => {
    const fetchFavourites = async () => {
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavouriteTeams(res.data.preferences?.favoriteTeams || []);
      } catch (err) {
        console.error('Error fetching favourites:', err);
      }
    };
    fetchFavourites();
  }, [token]);

  const fetchTeamsForLeague = async (sport, league) => {
    setLoading(true);
    try {
      let url = '';
      if (sport.id === 'cricket') {
        url = `http://localhost:5000/api/sports/teams/cricket?league=${league.id}`;
      } else if (sport.id === 'soccer') {
        url = `http://localhost:5000/api/sports/teams/soccer?league=${league.code}`;
      } else {
        url = `http://localhost:5000/api/sports/teams/${sport.id}`;
      }
      const res = await axios.get(url);
      const normalizedTeams = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setTeams(normalizedTeams);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setSnackbar({ open: true, message: 'Failed to load teams', severity: 'error' });
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLeagueSelect = (league) => {
    setSelectedLeague(league);
    fetchTeamsForLeague(selectedSport, league);
    setStep('teams');
  };

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

  const toggleFavourite = async (teamName) => {
    if (!token) {
      setSnackbar({ open: true, message: 'Please login to add favourite teams', severity: 'warning' });
      return;
    }

    const isFavourite = favouriteTeams.includes(teamName);
    
    if (!isFavourite && favouriteTeams.length >= maxFavourites) {
      setSnackbar({ 
        open: true, 
        message: `You can only favourite up to ${maxFavourites} teams. ${subscription?.plan !== 'pro' ? 'Upgrade to Pro for more!' : ''}`, 
        severity: 'warning' 
      });
      return;
    }

    try {
      const newFavourites = isFavourite
        ? favouriteTeams.filter(t => t !== teamName)
        : [...favouriteTeams, teamName];
      
      await axios.put('http://localhost:5000/api/users/me', {
        preferences: { favoriteTeams: newFavourites }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFavouriteTeams(newFavourites);
      setSnackbar({ 
        open: true, 
        message: isFavourite ? 'Team removed from favourites' : 'Team added to favourites! Matches will auto-sync daily at 12 AM.', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error toggling favourite:', err);
      setSnackbar({ open: true, message: 'Failed to update favourites', severity: 'error' });
    }
  };

  const filteredTeams = teams.filter(team =>
    (team.name || team.strTeam || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!token) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          Please login to manage your favourite teams and enable auto-sync.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {step !== 'sports' && (
            <IconButton onClick={handleBack}>
              <ArrowBack />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {step === 'sports' && '⭐ Select Favourite Teams'}
              {step === 'leagues' && `${selectedSport?.name} - Select League`}
              {step === 'teams' && `${selectedLeague?.name} - Select Teams`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 'sports' && 'Choose sports to explore leagues and teams'}
              {step === 'leagues' && 'Pick a league to see available teams'}
              {step === 'teams' && `Select up to ${maxFavourites} teams for auto-sync (${favouriteTeams.length}/${maxFavourites} selected)`}
            </Typography>
          </Box>
        </Box>

        {token && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ⭐ Your favourite teams' upcoming matches (within 2 days) will automatically sync to your calendar daily at 12 AM.
            {favouriteTeams.length > 0 && ` Currently tracking: ${favouriteTeams.join(', ')}`}
          </Alert>
        )}
      </Box>

      {/* Search (only in teams step) */}
      {step === 'teams' && (
        <TextField
          fullWidth
          placeholder="Search teams..."
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
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Sports Selection */}
      {!loading && step === 'sports' && (
        <Grid container spacing={3}>
          {sportsConfig.map((sport) => (
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

      {/* Leagues Selection */}
      {!loading && step === 'leagues' && selectedSport && (
        <Grid container spacing={3}>
          {selectedSport.leagues.map((league) => (
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
                  borderColor: 'divider',
                }}
                onClick={() => handleLeagueSelect(league)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {league.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click to view teams
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Teams Selection */}
      {!loading && step === 'teams' && (
        <Grid container spacing={3}>
          {filteredTeams.map((team) => {
            const isFavourite = favouriteTeams.includes(team.name || team.strTeam);
            const teamName = team.name || team.strTeam || 'Unknown Team';
            return (
              <Grid item xs={12} sm={6} md={4} key={team.id || team.idTeam}>
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
                    onClick={() => toggleFavourite(teamName)}
                  >
                    {isFavourite ? <Star color="warning" /> : <StarBorder />}
                  </IconButton>
                  <CardContent sx={{ pt: 6 }}>
                    {(team.logo || team.strTeamBadge) && (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img 
                          src={team.logo || team.strTeamBadge} 
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
                    {(team.location || team.strStadium) && (
                      <Typography variant="body2" color="text.secondary">
                        {team.location || team.strStadium}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {!loading && step === 'teams' && filteredTeams.length === 0 && (
        <Alert severity="info">
          No teams found{searchTerm && ` for "${searchTerm}"`}. Try adjusting your search.
        </Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default FavouriteTeams;
