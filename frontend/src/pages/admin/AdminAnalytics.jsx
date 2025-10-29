import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userGrowth, setUserGrowth] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [sportsData, setSportsData] = useState([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const [growthRes, subRes, sportsRes, metricsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/analytics/user-growth?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/admin/analytics/subscription-distribution', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/admin/analytics/popular-sports', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/admin/analytics/subscription-metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Format user growth data
      const formattedGrowth = growthRes.data.data.map(item => ({
        date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: item.count,
      }));
      setUserGrowth(formattedGrowth);

      // Format subscription data
      const formattedSubs = subRes.data.data.map(item => ({
        name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        value: item.count,
      }));
      setSubscriptionData(formattedSubs);

      // Format sports data
      const formattedSports = sportsRes.data.data.map(item => ({
        sport: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        events: item.count,
      }));
      setSportsData(formattedSports);

      // Set subscription metrics
      setSubscriptionMetrics(metricsRes.data.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error(err);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Analytics & Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive analytics and insights
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={days}
            label="Time Period"
            onChange={(e) => setDays(e.target.value)}
          >
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={90}>Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Subscription Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Total Subscriptions
              </Typography>
              <Typography variant="h3" color="white" fontWeight="bold">
                {subscriptionMetrics?.totalSubscriptions || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mt: 1 }}>
                Active Pro subscribers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Monthly Renewals
              </Typography>
              <Typography variant="h3" color="white" fontWeight="bold">
                {subscriptionMetrics?.monthlyRenewals || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mt: 1 }}>
                New subscriptions this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                Monthly Revenue (MRR)
              </Typography>
              <Typography variant="h3" color="white" fontWeight="bold">
                ₹{subscriptionMetrics?.mrr?.toLocaleString('en-IN') || 0}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mt: 1 }}>
                From Pro subscriptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                User Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#667eea"
                    strokeWidth={3}
                    dot={{ fill: '#667eea', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Subscription Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Sports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Most Popular Sports (By Events)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sportsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sport" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="events" fill="#4facfe" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminAnalytics;
