import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Storage as DatabaseIcon,
  Cloud as ServerIcon
} from '@mui/icons-material';

const AdminSettings = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AdminAuthContext);

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const res = await axios.get('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealth(res.data.health);
    } catch (error) {
      console.error('Error fetching system health:', error);
      setHealth({
        database: 'unhealthy',
        server: 'degraded',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'success';
    if (status === 'degraded') return 'warning';
    return 'error';
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckIcon />;
    return <ErrorIcon />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        System Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        System health and configuration
      </Typography>

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Health
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DatabaseIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Database
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        MongoDB Connection
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={health?.database || 'Unknown'}
                    color={getStatusColor(health?.database)}
                    icon={getStatusIcon(health?.database)}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ServerIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Server
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Express Server
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={health?.server || 'Unknown'}
                    color={getStatusColor(health?.server)}
                    icon={getStatusIcon(health?.server)}
                  />
                </Box>
              </CardContent>
            </Card>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Unknown'}
            </Typography>
          </Paper>
        </Grid>

        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Version</Typography>
              <Typography variant="body1">v1.0.0</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Environment</Typography>
              <Typography variant="body1">Production</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Node Version</Typography>
              <Typography variant="body1">{process.version || 'Unknown'}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Platform</Typography>
              <Typography variant="body1">{navigator.platform || 'Unknown'}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSettings;
