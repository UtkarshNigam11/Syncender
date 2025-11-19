import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Event,
  TrendingUp,
  AttachMoney,
  PersonAdd,
  CalendarToday,
} from '@mui/icons-material';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to fetch dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#667eea',
      subtitle: `${stats?.activeUsers || 0} active`,
    },
    {
      title: 'Pro Subscribers',
      value: stats?.proUsers || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#f093fb',
      subtitle: `${stats?.freeUsers || 0} free users`,
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: <Event sx={{ fontSize: 40 }} />,
      color: '#4facfe',
      subtitle: `${stats?.autoSyncedEvents || 0} auto-synced`,
    },
    {
      title: 'Revenue',
      value: `₹${stats?.revenue || 0}`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#43e97b',
      subtitle: 'Monthly recurring',
    },
    {
      title: 'New Signups',
      value: stats?.newSignupsToday || 0,
      icon: <PersonAdd sx={{ fontSize: 40 }} />,
      color: '#fa709a',
      subtitle: 'Today',
    },
    {
      title: 'Calendar Connected',
      value: stats?.usersWithCalendar || 0,
      icon: <CalendarToday sx={{ fontSize: 40 }} />,
      color: '#4facfe',
      subtitle: 'Google Calendar',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to Syncender Admin Panel
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                color: 'white',
                height: '100%',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                User Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Active Users</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.activeUsers || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Inactive Users</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.inactiveUsers || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">New This Month</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.newUsersThisMonth || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Avg Events/User</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.avgEventsPerUser || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Event Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Total Events</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.totalEvents || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Auto-Synced</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.autoSyncedEvents || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Manual Events</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.manualEvents || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;
