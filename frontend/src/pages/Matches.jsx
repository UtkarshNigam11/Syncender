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

  useEffect(() => {
    // Mock data for different match states
    const mockMatches = {
      live: [
        {
          id: 1,
          sport: 'NBA',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
          homeScore: 98,
          awayScore: 102,
          quarter: '4th Quarter',
          time: '2:15',
          venue: 'Staples Center',
          isLive: true,
        },
        {
          id: 2,
          sport: 'Cricket',
          homeTeam: 'India',
          awayTeam: 'Australia',
          homeScore: '287/6',
          awayScore: '45.2 overs',
          quarter: 'Live',
          time: '',
          venue: 'MCG, Melbourne',
          isLive: true,
        },
        {
          id: 3,
          sport: 'NFL',
          homeTeam: 'Cowboys',
          awayTeam: 'Giants',
          homeScore: 21,
          awayScore: 14,
          quarter: '3rd Quarter',
          time: '8:42',
          venue: 'AT&T Stadium',
          isLive: true,
        },
      ],
      today: [
        {
          id: 4,
          sport: 'NBA',
          homeTeam: 'Heat',
          awayTeam: 'Celtics',
          date: 'Today',
          time: '8:00 PM',
          venue: 'Madison Square Garden',
        },
        {
          id: 5,
          sport: 'Soccer',
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          date: 'Today',
          time: '9:00 PM',
          venue: 'Santiago Bernabéu',
        },
      ],
      upcoming: [
        {
          id: 6,
          sport: 'MLB',
          homeTeam: 'Yankees',
          awayTeam: 'Red Sox',
          date: 'Tomorrow',
          time: '7:30 PM',
          venue: 'Yankee Stadium',
        },
        {
          id: 7,
          sport: 'NHL',
          homeTeam: 'Rangers',
          awayTeam: 'Islanders',
          date: 'Aug 2',
          time: '7:00 PM',
          venue: 'Madison Square Garden',
        },
      ],
      completed: [
        {
          id: 8,
          sport: 'NBA',
          homeTeam: 'Knicks',
          awayTeam: 'Nets',
          homeScore: 115,
          awayScore: 108,
          date: 'Yesterday',
          venue: 'Barclays Center',
          final: true,
        },
        {
          id: 9,
          sport: 'Cricket',
          homeTeam: 'England',
          awayTeam: 'Pakistan',
          homeScore: '324/7',
          awayScore: '298 all out',
          date: 'Yesterday',
          venue: 'Lords, London',
          final: true,
        },
      ],
    };

    setMatches(mockMatches);
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

  const addToCalendar = (match) => {
    // This would integrate with your calendar API
    console.log('Adding to calendar:', match);
    // Show success message or navigate to calendar
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

  const renderMatchCard = (match) => (
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
        <CardContent sx={{ p: 3 }}>
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
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                {match.awayTeam}
              </Typography>
              {(match.awayScore !== undefined) && (
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {match.awayScore}
                </Typography>
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              @
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                {match.homeTeam}
              </Typography>
              {(match.homeScore !== undefined) && (
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {match.homeScore}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Match Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {match.venue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {match.isLive 
                ? `${match.quarter} ${match.time}` 
                : match.final 
                  ? `Final - ${match.date}`
                  : `${match.date} ${match.time || ''}`
              }
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<CalendarToday />}
              onClick={() => addToCalendar(match)}
              sx={{
                borderColor: getSportColor(match.sport),
                color: getSportColor(match.sport),
                '&:hover': {
                  backgroundColor: alpha(getSportColor(match.sport), 0.08),
                },
              }}
            >
              Add to Calendar
            </Button>
            {match.isLive && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow />}
                sx={{
                  backgroundColor: getSportColor(match.sport),
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                Watch
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

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