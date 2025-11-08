import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Autocomplete,
} from '@mui/material';
import {
  Send,
  Notifications,
  EmojiEvents,
  Groups,
  BarChart,
  BugReport,
} from '@mui/icons-material';
import axios from 'axios';

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Custom Notification State
  const [customNotif, setCustomNotif] = useState({
    targetType: 'all',
    userIds: [],
    title: '',
    message: '',
    priority: 'medium',
    category: 'system',
    actionUrl: '',
    actionText: ''
  });

  // Pro Announcement State
  const [proAnnouncement, setProAnnouncement] = useState({
    title: '',
    message: '',
    actionUrl: '',
    actionText: ''
  });

  // Team Alert State
  const [teamAlert, setTeamAlert] = useState({
    sport: 'cricket',
    teamName: '',
    title: '',
    message: '',
    matchId: '',
    actionUrl: '/matches'
  });

  // Statistics State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // User list for autocomplete
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    if (activeTab === 3) {
      fetchStats();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/notifications/stats?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setSnackbar({ open: true, message: 'Failed to fetch statistics', severity: 'error' });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSendCustomNotification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const payload = {
        ...customNotif,
        userIds: customNotif.targetType === 'all' ? 'all' : customNotif.userIds.map(u => u._id)
      };

      const response = await axios.post('/api/admin/notifications/send', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ 
        open: true, 
        message: response.data.message || 'Notification sent successfully!', 
        severity: 'success' 
      });
      
      // Reset form
      setCustomNotif({
        targetType: 'all',
        userIds: [],
        title: '',
        message: '',
        priority: 'medium',
        category: 'system',
        actionUrl: '',
        actionText: ''
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to send notification', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendProAnnouncement = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post('/api/admin/notifications/pro-announcement', proAnnouncement, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ 
        open: true, 
        message: response.data.message || 'Pro announcement sent!', 
        severity: 'success' 
      });
      
      // Reset form
      setProAnnouncement({
        title: '',
        message: '',
        actionUrl: '',
        actionText: ''
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to send announcement', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTeamAlert = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post('/api/admin/notifications/team-alert', teamAlert, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ 
        open: true, 
        message: response.data.message || 'Team alert sent!', 
        severity: 'success' 
      });
      
      // Reset form
      setTeamAlert({
        sport: 'cricket',
        teamName: '',
        title: '',
        message: '',
        matchId: '',
        actionUrl: '/matches'
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to send team alert', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post('/api/admin/notifications/test', {
        title: 'Test Notification',
        message: 'This is a test notification from the admin panel'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ 
        open: true, 
        message: 'Test notification sent to your account!', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to send test notification', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          📢 Notification Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send custom notifications, announcements, and alerts to users
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
          <Tab icon={<Send />} label="Custom Notification" />
          <Tab icon={<EmojiEvents />} label="Pro Announcement" />
          <Tab icon={<Groups />} label="Team Alert" />
          <Tab icon={<BarChart />} label="Statistics" />
          <Tab icon={<BugReport />} label="Test" />
        </Tabs>
      </Paper>

      {/* Tab 0: Custom Notification */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Send Custom Notification
            </Typography>
            
            <Grid container spacing={3}>
              {/* Target Selection */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel>Target Audience</FormLabel>
                  <RadioGroup
                    row
                    value={customNotif.targetType}
                    onChange={(e) => setCustomNotif({ ...customNotif, targetType: e.target.value, userIds: [] })}
                  >
                    <FormControlLabel value="all" control={<Radio />} label="All Users" />
                    <FormControlLabel value="specific" control={<Radio />} label="Specific Users" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {customNotif.targetType === 'specific' && (
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={users}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={customNotif.userIds}
                    onChange={(e, newValue) => setCustomNotif({ ...customNotif, userIds: newValue })}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Users" placeholder="Search users..." />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={customNotif.title}
                  onChange={(e) => setCustomNotif({ ...customNotif, title: e.target.value })}
                  placeholder="e.g., 🎉 New Feature Launch!"
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={customNotif.priority}
                    onChange={(e) => setCustomNotif({ ...customNotif, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message"
                  value={customNotif.message}
                  onChange={(e) => setCustomNotif({ ...customNotif, message: e.target.value })}
                  placeholder="Your notification message..."
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={customNotif.category}
                    onChange={(e) => setCustomNotif({ ...customNotif, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="match">Match</MenuItem>
                    <MenuItem value="team">Team</MenuItem>
                    <MenuItem value="subscription">Subscription</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action URL (optional)"
                  value={customNotif.actionUrl}
                  onChange={(e) => setCustomNotif({ ...customNotif, actionUrl: e.target.value })}
                  placeholder="/matches"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action Text (optional)"
                  value={customNotif.actionText}
                  onChange={(e) => setCustomNotif({ ...customNotif, actionText: e.target.value })}
                  placeholder="View Details"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  onClick={handleSendCustomNotification}
                  disabled={loading || !customNotif.title || !customNotif.message}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Notification'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Pro Announcement */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Pro Users Announcement
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={proAnnouncement.title}
                  onChange={(e) => setProAnnouncement({ ...proAnnouncement, title: e.target.value })}
                  placeholder="e.g., Exclusive Pro Feature"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Message"
                  value={proAnnouncement.message}
                  onChange={(e) => setProAnnouncement({ ...proAnnouncement, message: e.target.value })}
                  placeholder="Your announcement for Pro users..."
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action URL (optional)"
                  value={proAnnouncement.actionUrl}
                  onChange={(e) => setProAnnouncement({ ...proAnnouncement, actionUrl: e.target.value })}
                  placeholder="/favourites"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action Text (optional)"
                  value={proAnnouncement.actionText}
                  onChange={(e) => setProAnnouncement({ ...proAnnouncement, actionText: e.target.value })}
                  placeholder="Try It Now"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<EmojiEvents />}
                  onClick={handleSendProAnnouncement}
                  disabled={loading || !proAnnouncement.title || !proAnnouncement.message}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Send to Pro Users'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Team Alert */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Team-Specific Alert
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sport</InputLabel>
                  <Select
                    value={teamAlert.sport}
                    onChange={(e) => setTeamAlert({ ...teamAlert, sport: e.target.value })}
                    label="Sport"
                  >
                    <MenuItem value="cricket">Cricket</MenuItem>
                    <MenuItem value="soccer">Soccer</MenuItem>
                    <MenuItem value="nfl">NFL</MenuItem>
                    <MenuItem value="nba">NBA</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Team Name"
                  value={teamAlert.teamName}
                  onChange={(e) => setTeamAlert({ ...teamAlert, teamName: e.target.value })}
                  placeholder="e.g., Mumbai Indians"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={teamAlert.title}
                  onChange={(e) => setTeamAlert({ ...teamAlert, title: e.target.value })}
                  placeholder="e.g., 🏆 Big Match Tonight!"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message"
                  value={teamAlert.message}
                  onChange={(e) => setTeamAlert({ ...teamAlert, message: e.target.value })}
                  placeholder="Your alert message..."
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Match ID (optional)"
                  value={teamAlert.matchId}
                  onChange={(e) => setTeamAlert({ ...teamAlert, matchId: e.target.value })}
                  placeholder="12345"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action URL"
                  value={teamAlert.actionUrl}
                  onChange={(e) => setTeamAlert({ ...teamAlert, actionUrl: e.target.value })}
                  placeholder="/matches"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<Groups />}
                  onClick={handleSendTeamAlert}
                  disabled={loading || !teamAlert.teamName || !teamAlert.title || !teamAlert.message}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Team Alert'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Statistics */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notification Statistics
              </Typography>
              <Button onClick={fetchStats} disabled={statsLoading}>
                Refresh
              </Button>
            </Box>

            {statsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : stats ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                    <Typography variant="body2">Total Sent</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.read}</Typography>
                    <Typography variant="body2">Read</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.unread}</Typography>
                    <Typography variant="body2">Unread</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.readRate}</Typography>
                    <Typography variant="body2">Read Rate</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      By Type
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.byType?.map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{item._id}</TableCell>
                              <TableCell align="right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      By Category
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.byCategory?.map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{item._id}</TableCell>
                              <TableCell align="right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">No statistics available</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Test */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Test Notification
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Send a test notification to your own admin account
            </Alert>

            <Button
              variant="contained"
              size="large"
              startIcon={<BugReport />}
              onClick={handleTestNotification}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Send Test Notification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminNotifications;
