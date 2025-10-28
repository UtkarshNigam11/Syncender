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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  SportsHockey as Cricket,
  Sports as TennisIcon,
  DirectionsCar as FormulaIcon,
  Add,
  TrendingUp,
} from '@mui/icons-material';

const Sports = () => {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSports, setSelectedSports] = useState(new Set());

  // Fetch sports from API
  useEffect(() => {
    const fetchSports = async () => {
      try {
        // For now, use mock data since we're skipping authentication
        const mockSports = [
          { id: 'nfl', name: 'NFL (American Football)', provider: 'ESPN', description: 'National Football League - America\'s premier football competition' },
          { id: 'nba', name: 'NBA (Basketball)', provider: 'ESPN', description: 'National Basketball Association - The world\'s top basketball league' },
          { id: 'mlb', name: 'MLB (Baseball)', provider: 'ESPN', description: 'Major League Baseball - America\'s pastime' },
          { id: 'nhl', name: 'NHL (Hockey)', provider: 'ESPN', description: 'National Hockey League - Premier ice hockey competition' },
          { id: 'soccer', name: 'Soccer/Football', provider: 'ESPN', description: 'The beautiful game - World\'s most popular sport' },
          { id: 'cricket', name: 'Cricket', provider: 'SportsDB', description: 'Gentleman\'s game - Popular in India, Australia, England' },
          { id: 'tennis', name: 'Tennis', provider: 'SportsDB', description: 'Individual sport played on court with rackets' },
          { id: 'rugby', name: 'Rugby', provider: 'SportsDB', description: 'Physical team sport with oval ball' },
          { id: 'formula1', name: 'Formula 1', provider: 'SportsDB', description: 'Highest class of international auto racing' },
        ];
        
        setSports(mockSports);
        setLoading(false);
      } catch (err) {
        setError('Failed to load sports');
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  const getSportIcon = (sportId) => {
    const icons = {
      nba: <SportsBasketball />,
      nfl: <SportsFootball />,
      mlb: <SportsBaseball />,
      nhl: <SportsHockey />,
      cricket: <Cricket />,
      soccer: <SportsSoccer />,
      tennis: <TennisIcon />,
      rugby: <SportsFootball />,
      formula1: <FormulaIcon />,
    };
    return icons[sportId] || <SportsSoccer />;
  };

  const getSportColor = (sportId) => {
    const colors = {
      nba: '#FF6B00',
      nfl: '#0066CC',
      mlb: '#CC0000',
      nhl: '#000080',
      cricket: '#4CAF50',
      soccer: '#009688',
      tennis: '#9C27B0',
      rugby: '#795548',
      formula1: '#F44336',
    };
    return colors[sportId] || '#1976d2';
  };

  const filteredSports = sports.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSportSelect = (sportId) => {
    const newSelected = new Set(selectedSports);
    if (newSelected.has(sportId)) {
      newSelected.delete(sportId);
    } else {
      newSelected.add(sportId);
    }
    setSelectedSports(newSelected);
  };

  const handleViewMatches = (sportId) => {
    navigate(`/teams/${sportId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Explore Sports 🏆
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and follow your favorite sports. Add events to your calendar.
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search sports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedSports.size} sports selected
            </Typography>
            {selectedSports.size > 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => console.log('Add selected sports to calendar')}
              >
                Add to Calendar
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Error handling */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Sports Grid */}
      <Grid container spacing={3}>
        {filteredSports.map((sport) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={sport.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: selectedSports.has(sport.id) ? 2 : 1,
                borderColor: selectedSports.has(sport.id) 
                  ? getSportColor(sport.id) 
                  : 'divider',
                backgroundColor: selectedSports.has(sport.id)
                  ? alpha(getSportColor(sport.id), 0.04)
                  : 'background.paper',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  borderColor: getSportColor(sport.id),
                },
              }}
              onClick={() => handleSportSelect(sport.id)}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: getSportColor(sport.id),
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getSportIcon(sport.id)}
                  </Avatar>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                      label={sport.provider}
                      size="small"
                      sx={{
                        bgcolor: alpha(getSportColor(sport.id), 0.1),
                        color: getSportColor(sport.id),
                        fontWeight: 600,
                      }}
                    />
                    {selectedSports.has(sport.id) && (
                      <Chip
                        label="Added"
                        size="small"
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: selectedSports.has(sport.id) ? getSportColor(sport.id) : 'text.primary',
                  }}
                >
                  {sport.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, flexGrow: 1 }}
                >
                  {sport.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Button
                    variant={selectedSports.has(sport.id) ? 'contained' : 'outlined'}
                    size="small"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMatches(sport.id);
                    }}
                    sx={{
                      backgroundColor: selectedSports.has(sport.id) ? getSportColor(sport.id) : 'transparent',
                      borderColor: getSportColor(sport.id),
                      color: selectedSports.has(sport.id) ? 'white' : getSportColor(sport.id),
                      '&:hover': {
                        backgroundColor: getSportColor(sport.id),
                        color: 'white',
                      },
                    }}
                  >
                    View Matches
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Card sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Sports Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track live scores, upcoming matches, and team statistics
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {sports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sports
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Providers
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                24/7
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live Data
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Container>
  );
};

export default Sports;