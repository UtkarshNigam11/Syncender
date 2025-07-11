import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Snackbar,
  Chip
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Matches = () => {
  const { teamId } = useParams();
  const [matches, setMatches] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/sports/matches/team/${teamId}`);
        setMatches(res.data);
        
        // Set team name from first match
        if (res.data.length > 0) {
          const match = res.data[0];
          if (match.teams.home.toLowerCase().includes(teamId.replace('_', ' ')) || 
              match.teams.home.toLowerCase() === teamId) {
            setTeamName(match.teams.home);
          } else {
            setTeamName(match.teams.away);
          }
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [teamId]);

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const addToGoogleCalendar = async (match) => {
    try {
      // First save the event to our database
      const eventData = {
        title: match.title,
        description: `${match.teams.home} vs ${match.teams.away}`,
        startTime: match.startTime,
        endTime: match.endTime,
        sport: match.sport,
        teams: match.teams,
        location: match.location
      };
      
      const saveRes = await axios.post('http://localhost:5000/api/events', eventData);
      
      // Then add to Google Calendar
      const eventId = saveRes.data.data._id;
      await axios.post(`http://localhost:5000/api/events/${eventId}/google`);
      
      setSnackbar({ open: true, message: 'Event added to Google Calendar!' });
    } catch (err) {
      console.error('Error adding to calendar:', err);
      setSnackbar({ open: true, message: 'Failed to add event to calendar' });
    }
  };

  const addToAppleCalendar = async (match) => {
    try {
      const eventData = {
        summary: match.title,
        description: `${match.teams.home} vs ${match.teams.away}`,
        startTime: match.startTime,
        endTime: match.endTime,
        location: match.location
      };
      
      // Make a request to get the ICS file
      const response = await axios.post(
        'http://localhost:5000/api/apple/calendar', 
        eventData,
        { responseType: 'blob' }
      );
      
      // Create a download link for the ICS file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'event.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({ open: true, message: 'ICS file downloaded for Apple Calendar!' });
    } catch (err) {
      console.error('Error creating ICS file:', err);
      setSnackbar({ open: true, message: 'Failed to create ICS file' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link to="/sports" style={{ textDecoration: 'none', color: 'inherit' }}>
          Sports
        </Link>
        <Link to={`/teams/${matches[0]?.sport}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {matches[0]?.sport.charAt(0).toUpperCase() + matches[0]?.sport.slice(1)}
        </Link>
        <Typography color="text.primary">{teamName}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Upcoming Matches for {teamName}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {matches.length === 0 && !error ? (
        <Alert severity="info">No upcoming matches found for this team.</Alert>
      ) : (
        <Grid container spacing={3}>
          {matches.map((match) => (
            <Grid item xs={12} md={6} key={match.id}>
              <Card>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {match.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {formatDate(match.startTime)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SportsSoccerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}
                    </Typography>
                  </Box>
                  
                  {match.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {match.location}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={match.teams.home} 
                      color="primary" 
                      variant={match.teams.home === teamName ? "filled" : "outlined"}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                      vs
                    </Typography>
                    <Chip 
                      label={match.teams.away} 
                      color="primary"
                      variant={match.teams.away === teamName ? "filled" : "outlined"}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => addToGoogleCalendar(match)}
                  >
                    Add to Google Calendar
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => addToAppleCalendar(match)}
                  >
                    Add to Apple Calendar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default Matches;