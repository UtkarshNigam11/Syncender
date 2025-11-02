import React, { useState, useEffect, useContext } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  alpha,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import {
  CalendarToday,
  Add,
  Edit,
  Delete,
  Share,
  Event,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsHockey as Cricket,
  Google,
  Apple,
  Download,
} from '@mui/icons-material';

const Calendar = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [newEvent, setNewEvent] = useState({
    title: '',
    sport: '',
    teams: { home: '', away: '' },
    date: '',
    time: '',
    venue: '',
    type: 'sports', // 'sports' or 'personal'
  });

  // Mock calendar events
  useEffect(() => {
    const mockEvents = [
      {
        id: 1,
        title: 'Lakers vs Warriors',
        sport: 'NBA',
        teams: { home: 'Lakers', away: 'Warriors' },
        date: '2025-08-01',
        time: '20:00',
        venue: 'Crypto.com Arena',
        type: 'sports',
        status: 'upcoming',
      },
      {
        id: 2,
        title: 'India vs Australia',
        sport: 'Cricket',
        teams: { home: 'India', away: 'Australia' },
        date: '2025-08-02',
        time: '14:30',
        venue: 'MCG, Melbourne',
        type: 'sports',
        status: 'upcoming',
      },
      {
        id: 3,
        title: 'Cowboys vs Giants',
        sport: 'NFL',
        teams: { home: 'Cowboys', away: 'Giants' },
        date: '2025-08-03',
        time: '18:00',
        venue: 'AT&T Stadium',
        type: 'sports',
        status: 'upcoming',
      },
      {
        id: 4,
        title: 'Personal Training',
        date: '2025-08-01',
        time: '08:00',
        venue: 'Local Gym',
        type: 'personal',
        status: 'upcoming',
      },
    ];
    setEvents(mockEvents);
  }, []);

  const getSportIcon = (sport) => {
    const icons = {
      Cricket: <Cricket />,
      NBA: <SportsBasketball />,
      Soccer: <SportsSoccer />,
      NFL: <SportsFootball />,
    };
    return icons[sport] || <Event />;
  };

  const getSportColor = (sport) => {
    const colors = {
      Cricket: '#4CAF50',
      NBA: '#FF6B00',
      Soccer: '#009688',
      NFL: '#0066CC',
    };
    return colors[sport] || '#1976d2';
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setNewEvent({
      title: '',
      sport: '',
      teams: { home: '', away: '' },
      date: '',
      time: '',
      venue: '',
      type: 'sports',
    });
    setOpenDialog(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent(event);
    setOpenDialog(true);
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      // Update existing event
      setEvents(events.map(e => e.id === editingEvent.id ? { ...newEvent, id: editingEvent.id } : e));
    } else {
      // Create new event
      const id = Math.max(...events.map(e => e.id), 0) + 1;
      setEvents([...events, { ...newEvent, id, status: 'upcoming' }]);
    }
    setOpenDialog(false);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const exportToGoogle = async () => {
    try {
      // Check if user is already authenticated (has token)
      if (!user) {
        setSnackbar({ 
          open: true, 
          message: 'Please login first to connect Google Calendar', 
          severity: 'warning' 
        });
        return;
      }

      setSnackbar({ open: true, message: 'Connecting to Google Calendar...', severity: 'info' });
      
      // Call backend to get Google OAuth URL
      const response = await axios.get('/api/auth/google');
      
      if (response.data?.authUrl) {
        // Redirect user to Google OAuth consent page
        window.location.href = response.data.authUrl;
      } else {
        setSnackbar({ 
          open: true, 
          message: 'Failed to connect to Google Calendar. Please try again.', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'An error occurred. Please try again later.', 
        severity: 'error' 
      });
    }
  };

  const exportToApple = () => {
    console.log('Exporting to Apple Calendar...');
    setSnackbar({ open: true, message: 'Apple Calendar export coming soon!', severity: 'info' });
    // Generate ICS file
  };

  const downloadICS = () => {
    console.log('Downloading ICS file...');
    setSnackbar({ open: true, message: 'ICS download coming soon!', severity: 'info' });
    // Generate and download ICS file
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get events for today
  const todayEvents = events.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today;
  });

  // Get upcoming events (next 7 days)
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= nextWeek;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            My Calendar 📅
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your sports events and personal schedule
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Google />}
            onClick={exportToGoogle}
            sx={{ 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(66, 133, 244, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #357AE8 0%, #2D9248 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(66, 133, 244, 0.4)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            Sync Google
          </Button>
          <Button
            variant="contained"
            startIcon={<Apple />}
            onClick={exportToApple}
            sx={{ 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #1a1a1a 0%, #555555 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.4)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            Export Apple
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={downloadICS}
            sx={{ 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            Download ICS
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Today's Events */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Today's Events
                </Typography>
                <Chip 
                  label={todayEvents.length}
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    fontWeight: 600,
                  }} 
                />
              </Box>

              {todayEvents.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {todayEvents.map((event) => (
                    <Card 
                      key={event.id}
                      sx={{ 
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: event.type === 'sports' 
                          ? alpha(getSportColor(event.sport), 0.02) 
                          : 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: event.type === 'sports' 
                              ? getSportColor(event.sport) 
                              : 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {event.type === 'sports' ? getSportIcon(event.sport) : <Event />}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {event.time} • {event.venue}
                          </Typography>
                          {event.teams && (
                            <Typography variant="caption" color="text.secondary">
                              {event.teams.away} @ {event.teams.home}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleEditEvent(event)}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteEvent(event.id)}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No events scheduled for today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming
                </Typography>
                <Chip 
                  label={upcomingEvents.length}
                  sx={{ 
                    bgcolor: 'secondary.main', 
                    color: 'white',
                    fontWeight: 600,
                  }} 
                />
              </Box>

              {upcomingEvents.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflow: 'auto' }}>
                  {upcomingEvents.map((event) => (
                    <Card 
                      key={event.id}
                      sx={{ 
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: event.type === 'sports' 
                          ? alpha(getSportColor(event.sport), 0.02) 
                          : 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: event.type === 'sports' 
                              ? getSportColor(event.sport) 
                              : 'primary.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {event.type === 'sports' ? getSportIcon(event.sport) : <Event />}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(event.date).toLocaleDateString()} • {event.time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.venue}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleEditEvent(event)}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteEvent(event.id)}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No upcoming events
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Calendar Statistics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {events.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {events.filter(e => e.type === 'sports').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sports Events
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {todayEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {upcomingEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This Week
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add event"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleCreateEvent}
      >
        <Add />
      </Fab>

      {/* Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              fullWidth
            />
            
            <TextField
              select
              label="Type"
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              fullWidth
            >
              <MenuItem value="sports">Sports Event</MenuItem>
              <MenuItem value="personal">Personal Event</MenuItem>
            </TextField>

            {newEvent.type === 'sports' && (
              <>
                <TextField
                  select
                  label="Sport"
                  value={newEvent.sport}
                  onChange={(e) => setNewEvent({ ...newEvent, sport: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="Cricket">Cricket</MenuItem>
                  <MenuItem value="NBA">Basketball (NBA)</MenuItem>
                  <MenuItem value="Soccer">Soccer</MenuItem>
                  <MenuItem value="NFL">Football (NFL)</MenuItem>
                </TextField>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Home Team"
                    value={newEvent.teams?.home || ''}
                    onChange={(e) => setNewEvent({ 
                      ...newEvent, 
                      teams: { ...newEvent.teams, home: e.target.value }
                    })}
                    fullWidth
                  />
                  <TextField
                    label="Away Team"
                    value={newEvent.teams?.away || ''}
                    onChange={(e) => setNewEvent({ 
                      ...newEvent, 
                      teams: { ...newEvent.teams, away: e.target.value }
                    })}
                    fullWidth
                  />
                </Box>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <TextField
              label="Venue"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEvent} variant="contained">
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Calendar;
