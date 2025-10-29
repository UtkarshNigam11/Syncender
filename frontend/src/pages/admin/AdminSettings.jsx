import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';

function AdminSettings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealth();
    // Refresh health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealth(response.data.health);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch system health');
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        System Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Monitor system health and configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* System Health */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            System Health
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1">Database Status</Typography>
                <Chip
                  label={health?.database || 'Unknown'}
                  color={health?.database === 'healthy' ? 'success' : 'error'}
                  icon={health?.database === 'healthy' ? <CheckCircle /> : <Error />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1">Server Status</Typography>
                <Chip
                  label={health?.server || 'Unknown'}
                  color={health?.server === 'healthy' ? 'success' : 'error'}
                  icon={health?.server === 'healthy' ? <CheckCircle /> : <Error />}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1">Last Check</Typography>
                <Typography variant="body2" color="text.secondary">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Environment Configuration
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Environment
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {process.env.NODE_ENV || 'development'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Server Port
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                5000
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Google Calendar API
              </Typography>
              <Chip label="Configured" color="success" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Sports DB API
              </Typography>
              <Chip label="Configured" color="success" size="small" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            API Endpoints
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Base URL
            </Typography>
            <Typography variant="body1" fontWeight="mono">
              http://localhost:5000/api
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Admin API
            </Typography>
            <Typography variant="body1" fontWeight="mono">
              http://localhost:5000/api/admin
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminSettings;
