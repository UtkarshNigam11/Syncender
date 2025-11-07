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
  CircularProgress,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import {
  CalendarToday,
  Delete,
  Share,
  Event,
  SportsSoccer,
  SportsBasketball,
  SportsFootball,
  SportsCricket,
  Google,
  Apple,
  Download,
} from '@mui/icons-material';

const Calendar = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch events from backend
  const fetchEvents = async () => {
    if (!user) {
      console.log('User not logged in, skipping event fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('/api/events');
      
      // Handle response structure { success: true, events: [...] }
      const eventsData = response.data?.events || response.data || [];
      
      const formattedEvents = eventsData.map(event => ({
        id: event._id,
        title: event.title,
        sport: event.sport,
        teams: event.teams,
        date: new Date(event.startTime).toISOString().split('T')[0],
        time: new Date(event.startTime).toTimeString().slice(0, 5),
        venue: event.location || 'TBA',
        type: 'sports',
        status: event.status || 'upcoming',
        externalIds: event.externalIds,
        googleCalendarEventId: event.googleCalendarEventId || event.externalIds?.googleCalendar,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        setSnackbar({ 
          open: true, 
          message: 'Please login to view your calendar events', 
          severity: 'warning' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: 'Failed to load events', 
          severity: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync with Google Calendar
  const syncWithGoogle = async () => {
    if (!user) {
      setSnackbar({ 
        open: true, 
        message: 'Please login to sync with Google Calendar', 
        severity: 'warning' 
      });
      return;
    }

    try {
      setSyncing(true);
      setSnackbar({ 
        open: true, 
        message: 'Syncing with Google Calendar...', 
        severity: 'info' 
      });
      
      const response = await axios.post('/api/events/sync-google');
      
      console.log('📊 Sync response:', response.data);
      console.log('📊 Response data array:', response.data.data);
      console.log('📊 Response data length:', response.data.data?.length);
      
      if (response.data.success) {
        const formattedEvents = response.data.data.map(event => ({
          id: event._id,
          title: event.title,
          sport: event.sport,
          teams: event.teams,
          date: new Date(event.startTime).toISOString().split('T')[0],
          time: new Date(event.startTime).toTimeString().slice(0, 5),
          venue: event.location || 'TBA',
          type: 'sports',
          status: event.status || 'upcoming',
          externalIds: event.externalIds,
          googleCalendarEventId: event.googleCalendarEventId || event.externalIds?.googleCalendar,
        }));
        
        console.log(`📊 Formatted events count: ${formattedEvents.length}`);
        console.log('📋 Events after sync:', formattedEvents);
        console.log('📋 Event titles:', formattedEvents.map(e => e.title));
        console.log('📋 Event dates:', formattedEvents.map(e => e.date));
        
        setEvents(formattedEvents);
        console.log('✅ Events state updated');
        
        const syncInfo = response.data.syncInfo;
        const message = syncInfo.deletedFromLocal > 0 
          ? `Sync complete! ${syncInfo.deletedFromLocal} event(s) removed (deleted from Google Calendar)`
          : 'Sync complete! All events are up to date';
        
        setSnackbar({ 
          open: true, 
          message, 
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      
      // Check if Google Calendar is not connected
      if (error.response?.status === 400 && error.response?.data?.message?.includes('not connected')) {
        setSnackbar({ 
          open: true, 
          message: 'Google Calendar not connected. Click "Sync Google" to connect.', 
          severity: 'info' 
        });
        throw error; // Re-throw to trigger connection flow in exportToGoogle
      } else if (error.response?.status === 401) {
        setSnackbar({ 
          open: true, 
          message: 'Please login to sync with Google Calendar', 
          severity: 'warning' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to sync with Google Calendar', 
          severity: 'error' 
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getSportIcon = (sport) => {
    const icons = {
      Cricket: <SportsCricket />,
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

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? It will also be removed from Google Calendar.')) {
      return;
    }

    try {
      await axios.delete(`/api/events/${eventId}`);
      setSnackbar({ 
        open: true, 
        message: 'Event deleted successfully', 
        severity: 'success' 
      });
      fetchEvents(); // Reload events
    } catch (error) {
      console.error('Error deleting event:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to delete event', 
        severity: 'error' 
      });
    }
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

      // Try to sync first (if already connected)
      await syncWithGoogle();
    } catch (error) {
      // If sync fails, try to connect/reconnect
      try {
        setSnackbar({ open: true, message: 'Connecting to Google Calendar...', severity: 'info' });
        
        // Call backend to get Google OAuth URL
        const response = await axios.get('/api/auth/google/link', {
          headers: {
            Authorization: undefined
          }
        });
        
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
      } catch (connectError) {
        console.error('Google Calendar connection error:', connectError);
        setSnackbar({ 
          open: true, 
          message: connectError.response?.data?.message || 'An error occurred. Please try again later.', 
          severity: 'error' 
        });
      }
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
  // Get events for today
  const todayEvents = events.filter(event => {
    // Parse the date from YYYY-MM-DD format
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    // Compare timestamps
    return eventDate.getTime() === today.getTime();
  });

  // Get upcoming events (next 7 days, excluding today)
  const upcomingEvents = events.filter(event => {
    // Parse the date from YYYY-MM-DD format
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    eventDate.setHours(0, 0, 0, 0);
    
    // Event should be from tomorrow onwards and within next 7 days
    return eventDate.getTime() >= tomorrow.getTime() && eventDate.getTime() <= nextWeek.getTime();
  }).sort((a, b) => {
    const [yearA, monthA, dayA] = a.date.split('-').map(Number);
    const [yearB, monthB, dayB] = b.date.split('-').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB;
  });

  // Helper function to format date in DD/MM/YYYY format
  const formatDateIndian = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

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
            startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <Google />}
            onClick={exportToGoogle}
            disabled={syncing || loading}
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
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
              }
            }}
          >
            {syncing ? 'Syncing...' : 'Sync Google'}
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

      {!user ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Please login to view and manage your calendar events
              </Typography>
              <Button 
                variant="contained" 
                href="/login"
                sx={{ mt: 2 }}
              >
                Go to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {user && !loading && (
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
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteEvent(event.id)}
                            color="error"
                          >
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
                            {formatDateIndian(event.date)} • {event.time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.venue}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteEvent(event.id)}
                            color="error"
                          >
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
      )}

      {/* Event Dialog - Remove this since we don't allow editing */}
      {/* Floating Action Button - Removed since events come from sports matches only */}

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
