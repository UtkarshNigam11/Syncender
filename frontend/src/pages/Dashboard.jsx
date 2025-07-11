import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/events');
        setEvents(res.data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load your events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name || 'User'}!
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" sx={{ mb: 2 }}>
                <SportsSoccerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Sports Selection
              </Typography>
              <Typography variant="body1">
                Browse available sports and select your favorite teams to follow their matches.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} to="/sports" variant="contained" color="primary">
                Browse Sports
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" sx={{ mb: 2 }}>
                <CalendarMonthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Calendar Integration
              </Typography>
              <Typography variant="body1">
                Connect your Google or Apple Calendar to automatically sync sports events.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} to="/profile" variant="contained" color="secondary">
                Manage Calendars
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" sx={{ mb: 2 }}>
                Upcoming Events
              </Typography>
              
              {events.length > 0 ? (
                <List>
                  {events.slice(0, 5).map((event) => (
                    <React.Fragment key={event._id}>
                      <ListItem>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {event.teams.home} vs {event.teams.away}
                              </Typography>
                              <br />
                              {formatDate(event.startTime)}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">
                  No upcoming events. Add some teams to see their matches here!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;