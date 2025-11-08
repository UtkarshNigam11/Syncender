import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  TextField,
  Grid,
  Chip,
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { AuthContext } from '../context/AuthContext';

const SectionCard = ({ title, subtitle, children, action }) => (
  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);

const Profile = () => {
  const { user, updateUser, googleAuth, logout, getSubscription } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Forms
  const [basic, setBasic] = useState({ name: '', email: '' });
  const [preferences, setPreferences] = useState({ favoriteSports: [], favoriteTeams: [], appearance: { darkMode: false }, notifications: { matchReminders: true } });
  const [passwords, setPasswords] = useState({ password: '', newPassword: '', confirmPassword: '' });
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [plan, setPlan] = useState({ plan: 'free', planStatus: 'active', planExpiresAt: null, limits: { favoriteTeams: 2 } });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get('/api/users/me');
        const data = res.data;
        setMe(data);
        setBasic({ name: data.name || '', email: data.email || '' });
        setPreferences({
          favoriteSports: data.preferences?.favoriteSports || [],
          favoriteTeams: data.preferences?.favoriteTeams || [],
          appearance: data.preferences?.appearance || { darkMode: false },
          notifications: data.preferences?.notifications || { matchReminders: true },
        });
        setCalendarConnected(!!data.googleCalendarToken?.accessToken);
        const sub = await getSubscription();
        if (sub?.success) setPlan(sub);
      } catch (e) {
        setErr('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [getSubscription]);

  const saveBasic = async () => {
    setMsg(''); setErr('');
    const r = await updateUser({ name: basic.name });
    if (r.success) setMsg('Saved'); else setErr(r.message || 'Save failed');
  };

  const savePreferences = async () => {
    setMsg(''); setErr('');
    const r = await updateUser({ preferences });
    if (r.success) setMsg('Preferences updated'); else setErr(r.message || 'Update failed');
  };

  const changePassword = async () => {
    setMsg(''); setErr('');
    if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
      setErr('New passwords do not match');
      return;
    }
    const r = await updateUser({ password: passwords.password, newPassword: passwords.newPassword });
    if (r.success) setMsg('Password changed'); else setErr(r.message || 'Change failed');
  };

  const connectGoogle = async () => {
    const url = await googleAuth();
    if (url) window.location.href = url;
  };

  const disconnectGoogle = async () => {
    setMsg(''); setErr('');
    try {
      await axios.delete('/api/users/me/google-calendar');
      setCalendarConnected(false);
      setMsg('Disconnected Google Calendar');
    } catch (e) {
      setErr('Failed to disconnect');
    }
  };

  const logoutAll = async () => {
    try {
      await axios.post('/api/auth/logout-all');
      setMsg('Requested logout from all devices. Changing password will invalidate old tokens.');
    } catch (e) {
      setErr('Failed to request logout-all');
    }
  };

  const sportsOptions = ['Soccer', 'NBA', 'NFL', 'MLB', 'NHL', 'Cricket'];
  const teamsPlaceholder = ['LA Lakers', 'Real Madrid', 'Manchester City', 'Dallas Cowboys', 'India Cricket'];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Profile</Typography>
        {err && <Alert severity="error">{err}</Alert>}
        {msg && <Alert severity="success">{msg}</Alert>}

        {/* Basic Info */}
        <SectionCard title="Basic Info" subtitle="Your personal details and linked accounts." action={<Button variant="contained" onClick={saveBasic}>Save</Button>}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Name" fullWidth value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" fullWidth value={basic.email} disabled /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Linked accounts</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={calendarConnected ? 'Google Connected' : 'Google Disconnected'} color="primary" />
                <Chip label="Apple (Not connected)" color="primary" variant="outlined" />
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Sports Preferences */}
        <SectionCard title="Sports Preferences" subtitle={`Choose your favourites. Plan limit: ${plan?.limits?.favoriteTeams ?? 2} teams.`} action={<Button variant="contained" onClick={savePreferences}>Save preferences</Button>}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete multiple options={sportsOptions} value={preferences.favoriteSports} onChange={(_, v) => setPreferences({ ...preferences, favoriteSports: v })} renderInput={(params) => <TextField {...params} label="Favourite sports" />} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete 
                multiple 
                freeSolo
                options={teamsPlaceholder} 
                value={preferences.favoriteTeams?.map(team => typeof team === 'string' ? team : team.name) || []} 
                onChange={(_, v) => setPreferences({ ...preferences, favoriteTeams: v })} 
                renderInput={(params) => <TextField {...params} label="Favourite teams or leagues" placeholder="Add teams..." />} 
              />
            </Grid>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={!!preferences.notifications?.matchReminders} onChange={(_, c) => setPreferences({ ...preferences, notifications: { ...(preferences.notifications || {}), matchReminders: c } })} />} label="Match reminders" /></Grid>
          </Grid>
        </SectionCard>

        {/* Calendar Connection */}
  <SectionCard title="Calendar Connection" subtitle="Connect your Google Calendar to sync events." action={!calendarConnected ? <Button variant="contained" startIcon={<GoogleIcon />} onClick={connectGoogle}>Connect</Button> : <Button variant="outlined" color="error" onClick={disconnectGoogle}>Disconnect</Button>}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={calendarConnected ? 'Connected' : 'Not connected'} color="primary" />
          </Stack>
        </SectionCard>

        {/* Subscription */}
        <SectionCard title="Subscription" subtitle="Your current plan and benefits.">
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={(plan?.plan || 'free').toUpperCase()} color="primary" />
            <Typography variant="body2" color="text.secondary">Next billing: {plan.planExpiresAt ? new Date(plan.planExpiresAt).toLocaleDateString('en-GB') : '—'}</Typography>
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>Billing and payments are placeholders for now.</Alert>
        </SectionCard>

        {/* Security */}
  <SectionCard title="Security" subtitle="Change password or logout sessions." action={<Button variant="contained" onClick={changePassword}>Save password</Button>}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField type="password" label="Current password" fullWidth value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} /></Grid>
            <Grid item xs={12} sm={3}><TextField type="password" label="New password" fullWidth value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></Grid>
            <Grid item xs={12} sm={3}><TextField type="password" label="Confirm new password" fullWidth value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" color="error" onClick={logoutAll}>Logout all devices</Button>
                <Button variant="outlined" color="error" onClick={logout}>Logout</Button>
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>
      </Box>
    </Container>
  );
};

export default Profile;