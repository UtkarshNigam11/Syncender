import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Block as BlockIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AdminAuthContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/users?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.stats);
      setRecentUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#667eea',
      subtitle: `${stats?.newSignupsToday || 0} new today`
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: <CheckIcon sx={{ fontSize: 40 }} />,
      color: '#4facfe',
      subtitle: `${stats?.inactiveUsers || 0} inactive`
    },
    {
      title: 'Pro Subscribers',
      value: stats?.proUsers || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f093fb',
      subtitle: `${stats?.freeUsers || 0} free users`
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.revenue || 0}`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#fa709a',
      subtitle: 'Monthly recurring'
    },
    {
      title: 'Total Events Synced',
      value: stats?.totalEvents || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#fee140',
      subtitle: `${stats?.autoSyncedEvents || 0} auto-synced`
    },
    {
      title: 'New This Month',
      value: stats?.newUsersThisMonth || 0,
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      color: '#a8edea',
      subtitle: 'User signups'
    },
    {
      title: 'Calendar Connected',
      value: stats?.usersWithCalendar || 0,
      icon: <CalendarIcon sx={{ fontSize: 40 }} />,
      color: '#6a11cb',
      subtitle: 'Google Calendar users'
    },
    {
      title: 'Avg Events/User',
      value: stats?.avgEventsPerUser || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#2575fc',
      subtitle: 'Per user average'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Real-time statistics and analytics
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                color: 'white',
                height: '140px',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(50%, -50%)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.6 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Users Table */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Users
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Plan</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Events</strong></TableCell>
                <TableCell><strong>Joined</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.plan.toUpperCase()} 
                      size="small"
                      color={user.plan === 'pro' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Active' : 'Inactive'} 
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                      icon={user.isActive ? <CheckIcon /> : <BlockIcon />}
                    />
                  </TableCell>
                  <TableCell>{user.eventCount || 0}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
