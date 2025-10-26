import React, { useEffect, useState, useContext } from 'react';
import { Container, Paper, Typography, Box, Button, Chip, Divider, Grid, Select, MenuItem, FormControl, InputLabel, Alert, Switch, FormControlLabel, TextField, Tabs, Tab, Stack, Tooltip } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import GoogleIcon from '@mui/icons-material/Google';

const PRICING = { INR: { proMonthly: 99, currency: '₹', note: 'Affordable plan for India' } };

const Section = ({ title, children, description, action }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="h6">{title}</Typography>
      {action}
    </Box>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>{children}</Paper>
  </Box>
);

const Settings = () => {
  const { token, getSubscription } = useContext(AuthContext);
  const { isDarkMode, setThemeMode, density, setDensity } = useTheme();
  const [sub, setSub] = useState(null);
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setMessage(''); setError('');
    if (!token) return; // avoid requests when not authenticated
    const data = await getSubscription();
    setSub(data);
    try {
      const res = await axios.get('/api/users/me');
      setMe(res.data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, [token]);

  const savePreferences = async (patch) => {
    try {
      const next = { preferences: patch };
      await axios.put('/api/users/me', next);
      await load();
      setMessage('Preferences updated');
    } catch {
      setError('Failed to update preferences');
    }
  };

  const connectGoogle = async () => {
    try {
      const { data } = await axios.get('/api/auth/google');
      window.location.href = data.authUrl;
    } catch { setError('Failed to start Google auth'); }
  };

  const upgrade = async () => {
    try {
      await axios.post('/api/subscription/upgrade', { plan: 'pro' });
      await load();
      setMessage('Upgraded to Pro');
    } catch { setError('Upgrade failed'); }
  };

  const limit = sub?.limits?.favoriteTeams ?? 2;
  const used = me?.preferences?.favoriteTeams?.length || 0;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Settings</Typography>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Account" />
          <Tab label="Subscription" />
          <Tab label="Preferences" />
          <Tab label="Notifications" />
          <Tab label="Integrations" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Section title="Account" description="Manage your personal information.">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Name" value={me?.name || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" value={me?.email || ''} disabled />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">For password changes, go to Profile.</Typography>
                </Grid>
              </Grid>
            </Section>

            <Section title="Favorite Teams" description={`Follow up to ${limit} teams on your current plan.`}
              action={sub?.plan !== 'pro' && <Button onClick={upgrade} variant="contained">Upgrade to Pro</Button>}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(me?.preferences?.favoriteTeams || []).map(t => (
                  <Chip key={t} label={t} />
                ))}
                {used === 0 && <Typography variant="body2" color="text.secondary">No teams added yet. Go to Dashboard to add.</Typography>}
              </Stack>
            </Section>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Section title="Plan" description="Your subscription details and benefits.">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ m: 0 }}>Current plan:</Typography>
                <Chip label={(sub?.plan || 'free').toUpperCase()} color={sub?.plan === 'pro' ? 'success' : 'default'} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Limit: Follow up to {limit} teams.</Typography>
              {sub?.plan !== 'pro' && (
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Pro — {PRICING.INR.currency}{PRICING.INR.proMonthly}/month</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{PRICING.INR.note}</Typography>
                  <Button variant="contained" onClick={upgrade}>Upgrade to Pro</Button>
                </Box>
              )}
            </Section>
          </>
        )}

        {activeTab === 2 && (
          <>
            <Section title="Appearance" description="Theme and density settings.">
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDarkMode}
                      onChange={e => setThemeMode(e.target.checked ? 'dark' : 'light')}
                    />
                  }
                  label="Enable dark mode"
                />
                <FormControl fullWidth>
                  <InputLabel id="density">Density</InputLabel>
                  <Select
                    labelId="density"
                    label="Density"
                    value={density}
                    onChange={e => {
                      setDensity(e.target.value);
                      savePreferences({ appearance: { density: e.target.value } });
                    }}
                  >
                    <MenuItem value={'comfortable'}>Comfortable</MenuItem>
                    <MenuItem value={'compact'}>Compact</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="tz">Timezone</InputLabel>
                  <Select labelId="tz" label="Timezone" value={me?.preferences?.timezone || 'UTC'} onChange={(e) => savePreferences({ timezone: e.target.value })}>
                    <MenuItem value={'UTC'}>UTC</MenuItem>
                    <MenuItem value={'Asia/Kolkata'}>Asia/Kolkata (IST)</MenuItem>
                    <MenuItem value={'America/New_York'}>America/New_York</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Section>

            <Section title="Privacy" description="Control what we store.">
              <Typography variant="body2" color="text.secondary">We only store essential data to run your account and preferences.</Typography>
            </Section>
          </>
        )}

        {activeTab === 3 && (
          <Section title="Notifications" description="Choose how and when we notify you.">
            <Stack spacing={2}>
              <FormControlLabel control={<Switch checked={!!me?.preferences?.notifications?.matchReminders} onChange={(e) => savePreferences({ notifications: { matchReminders: e.target.checked }})} />} label="Match reminders" />
              <FormControlLabel control={<Switch checked={!!me?.preferences?.notifications?.newsUpdates} onChange={(e) => savePreferences({ notifications: { newsUpdates: e.target.checked }})} />} label="News updates" />
              <FormControlLabel control={<Switch checked={!!me?.preferences?.notifications?.emailAlerts} onChange={(e) => savePreferences({ notifications: { emailAlerts: e.target.checked }})} />} label="Email alerts" />
            </Stack>
          </Section>
        )}

        {activeTab === 4 && (
          <Section title="Connected Calendars" description="Connect Google Calendar to sync events.">
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Connect your Google account">
                <span>
                  <Button variant="outlined" startIcon={<GoogleIcon />} onClick={connectGoogle}>Connect Google</Button>
                </span>
              </Tooltip>
              {me?.googleCalendarToken && <Chip color="success" label="Google Connected" />}
            </Stack>
          </Section>
        )}

        {message && <Alert sx={{ mt: 2 }} severity="success">{message}</Alert>}
        {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
      </Box>
    </Container>
  );
};

export default Settings;
