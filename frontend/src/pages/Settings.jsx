import React, { useEffect, useState, useContext, useRef } from 'react';
import { Container, Paper, Typography, Box, Button, Chip, Divider, Grid, Select, MenuItem, FormControl, InputLabel, Alert, Switch, FormControlLabel, TextField, Tabs, Tab, Stack, Tooltip, keyframes } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import GoogleIcon from '@mui/icons-material/Google';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

// Define animations
const googlePop = keyframes`
  0%{ transform: translateY(0) scale(1); box-shadow:0 6px 20px rgba(66,133,244,0.08); }
  35%{ transform: translateY(-6px) scale(1.04); box-shadow:0 20px 40px rgba(66,133,244,0.18); }
  70%{ transform: translateY(-2px) scale(1.02); box-shadow:0 12px 28px rgba(66,133,244,0.12); }
  100%{ transform: translateY(0) scale(1); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
`;

const disconnectPop = keyframes`
  0%{ transform:translateY(0) scale(1); }
  40%{ transform:translateY(-8px) scale(1.06); }
  70%{ transform:translateY(-2px) scale(1.02); }
  100%{ transform:translateY(0) scale(1); }
`;

const spin = keyframes`
  100%{ transform: rotate(360deg); }
`;

// Button style objects
const googleBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '12px 28px',
  background: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '50px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#1f2937',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease',
  outline: 'none',
  '& svg': { 
    width: '20px', 
    height: '20px', 
    flexShrink: 0 
  },
  '&:hover': {
    background: '#f9fafb',
    borderColor: '#d1d5db',
    boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)'
  },
  '&:focus': {
    outline: 'none',
    boxShadow: 'none'
  },
  '&:focus-visible': {
    boxShadow: '0 0 0 4px rgba(66,133,244,0.12)'
  },
  '&:active': { 
    transform: 'translateY(-1px) scale(0.998)' 
  },
  '&.animate': {
    animation: `${googlePop} 520ms cubic-bezier(.2,.8,.2,1)`
  }
};

const disconnectBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 22px',
  borderRadius: '999px',
  color: '#fff',
  fontWeight: 700,
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg,#ef4444 0%, #f97373 100%)',
  boxShadow: '0 6px 22px rgba(239,68,68,0.22), inset 0 -6px 12px rgba(255,255,255,0.03)',
  transition: 'transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s ease, filter .18s ease',
  outline: 'none',
  '& .label': { 
    display: 'inline-block', 
    lineHeight: 1 
  },
  '&:hover': {
    transform: 'translateY(-3px)',
    filter: 'brightness(1.02)',
    boxShadow: '0 18px 40px rgba(239,68,68,0.22), inset 0 -8px 18px rgba(255,255,255,0.04)'
  },
  '&:active': { 
    transform: 'translateY(-1px) scale(0.995)' 
  },
  '&:focus': { 
    outline: 'none' 
  },
  '&:focus-visible': {
    boxShadow: '0 10px 30px rgba(239,68,68,0.16), 0 0 0 6px rgba(239,68,68,0.08)'
  },
  '&.busy': {
    pointerEvents: 'none',
    opacity: 0.98,
    transform: 'none'
  },
  '&.animate': {
    animation: `${disconnectPop} 420ms cubic-bezier(.2,.8,.2,1)`
  },
  '& .spinner': {
    animation: `${spin} 950ms linear infinite`
  },
  '& svg': {
    width: '16px',
    height: '16px',
    flexShrink: 0
  }
};

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
  const [disconnecting, setDisconnecting] = useState(false); // added: disconnect loading state

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

  // added: mask email helper — leaves 1-3 chars visible at start
  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = String(email).split('@');
    if (!domain) return email;
    const len = Math.max(0, user.length);
    const visible = Math.min(3, Math.max(1, Math.floor(len * 0.25) || 1));
    const start = user.slice(0, visible);
    const end = user.slice(-2);
    const stars = '*'.repeat(Math.max(0, len - visible - 2));
    return `${start}${stars}${end}@${domain}`;
  };

  // added: disconnect handler (keeps existing logic)
  const disconnectGoogle = async () => {
    setDisconnecting(true);
    setMessage(''); setError('');
    try {
      await axios.delete('/api/users/me/google-calendar');
      await load();
      setMessage('Logged out');
    } catch (e) {
      setError('Failed to disconnect Google account');
    } finally {
      setDisconnecting(false);
    }
  };

  // ref and handler to trigger a brief attractive animation before starting auth
  const googleBtnRef = useRef(null);
  const handleGoogleClick = () => {
    const el = googleBtnRef.current;
    if (el) {
      // restart animation
      el.classList.remove('animate');
      // trigger reflow to allow re-adding the class
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth;
      el.classList.add('animate');
    }
    // small delay so animation is visible before redirecting
    setTimeout(() => connectGoogle(), 180);
  };

  // disconnect button micro-interaction
  const disconnectBtnRef = useRef(null);
  const handleDisconnectClick = () => {
    const el = disconnectBtnRef.current;
    if (el) {
      el.classList.remove('animate');
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth;
      el.classList.add('animate');
    }
    // leave a tiny moment for the animation before firing the network call
    setTimeout(() => disconnectGoogle(), 120);
  };

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
            <Box>
                {(() => {
                  const connected = !!me?.googleCalendarToken?.accessToken;
                  const email = me?.email || '';

                  if (connected) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                        <Box
                          component="button"
                          ref={disconnectBtnRef}
                          sx={disconnectBtnStyles}
                          className={disconnecting ? 'busy' : ''}
                          onClick={handleDisconnectClick}
                          aria-label="Logout from Google account"
                          disabled={disconnecting}
                          aria-busy={disconnecting}
                        >
                          {disconnecting ? (
                            <svg className="spinner" viewBox="0 0 50 50" width="16" height="16" aria-hidden>
                              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="#fff" strokeLinecap="round"/>
                            </svg>
                          ) : (
                            <GoogleIcon sx={{ width: 18, height: 18, color: '#fff' }} />
                          )}
                          <span className="label">{disconnecting ? 'Logging out…' : 'Logout'}</span>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Linked Account</Typography>
                          <Typography sx={{ fontSize: 14, color: 'text.primary', fontWeight: 600, fontFamily: 'monospace' }} title={email}>{maskEmail(email)}</Typography>
                          
                        </Box>
                      </Box>
                    );
                  }

                  return (
                    <Box
                      ref={googleBtnRef}
                      component="button"
                      sx={googleBtnStyles}
                      onClick={handleGoogleClick}
                      aria-label="Connect Google account"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Sign in with Google</span>
                    </Box>
                  );
                })()}
              </Box>

            {/* undo snackbar removed per request */}
          </Section>
        )}

        {message && <Alert sx={{ mt: 2 }} severity="success">{message}</Alert>}
        {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
      </Box>
    </Container>
  );
};

export default Settings;
