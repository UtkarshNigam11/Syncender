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
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Speed,
  Storage,
  CloudQueue,
} from '@mui/icons-material';
import axios from 'axios';

function AdminMonitoring() {
  const [health, setHealth] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [cronStatus, setCronStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonitoringData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const [healthRes, apiRes, cronRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/system/health', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/admin/system/api-health', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/admin/system/cron-status', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setHealth(healthRes.data.health);
      setApiHealth(apiRes.data.apis);
      setCronStatus(cronRes.data.cronJobs);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch monitoring data');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle color="success" />;
      case 'degraded':
      case 'slow':
        return <Warning color="warning" />;
      case 'unhealthy':
      case 'offline':
        return <Error color="error" />;
      default:
        return <Warning />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'success';
      case 'degraded':
      case 'slow':
        return 'warning';
      case 'unhealthy':
      case 'offline':
        return 'error';
      default:
        return 'default';
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
        System Monitoring
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Real-time system health and performance metrics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* System Health */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Database
                  </Typography>
                  <Chip
                    label={health?.database || 'Unknown'}
                    size="small"
                    color={getStatusColor(health?.database)}
                    icon={getStatusIcon(health?.database)}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                MongoDB Connection Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Server
                  </Typography>
                  <Chip
                    label={health?.server || 'Unknown'}
                    size="small"
                    color={getStatusColor(health?.server)}
                    icon={getStatusIcon(health?.server)}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Server Status & Performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueue sx={{ fontSize: 40, mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    API Services
                  </Typography>
                  <Chip
                    label={apiHealth?.every(api => api.status === 'online') ? 'All Online' : 'Degraded'}
                    size="small"
                    color={apiHealth?.every(api => api.status === 'online') ? 'success' : 'warning'}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                External API Integrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Health Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            API Health Status
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {apiHealth?.map((api, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {api.name}
                    </Typography>
                    <Chip
                      label={api.status}
                      size="small"
                      color={getStatusColor(api.status)}
                      icon={getStatusIcon(api.status)}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Response: {api.responseTime}ms
                  </Typography>
                  {api.responseTime > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((api.responseTime / 1000) * 100, 100)}
                      sx={{ mt: 1 }}
                      color={api.responseTime < 500 ? 'success' : api.responseTime < 1000 ? 'warning' : 'error'}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Cron Job Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Cron Job Status
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {cronStatus?.map((job, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {job.name}
                    </Typography>
                    <Chip
                      label={job.status}
                      size="small"
                      color={getStatusColor(job.status)}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Schedule: {job.schedule}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last Run: {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Next Run: {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminMonitoring;
