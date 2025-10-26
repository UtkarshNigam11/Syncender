import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon,
  SportsBaseball as SportsIcon
} from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, googleAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const authUrl = await googleAuth();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setError('Failed to start Google authentication');
      }
    } catch (e) {
      setError('Failed to start Google authentication');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 4
          }}
        >
          {/* Left Side - Branding */}
          <Box
            sx={{
              flex: 1,
              textAlign: { xs: 'center', md: 'left' },
              color: 'white',
              display: { xs: 'none', md: 'block' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <CalendarIcon sx={{ fontSize: 48, mr: 2 }} />
              <Typography variant="h3" fontWeight={700}>
                Syncender
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
              Never Miss a Game Again
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: 500 }}>
              Stay updated with your favorite sports events, get real-time notifications, 
              and sync matches directly to your calendar. Your ultimate sports companion.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <SportsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              <CalendarIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              <EmailIcon sx={{ fontSize: 40, opacity: 0.7 }} />
            </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box sx={{ flex: 1, width: '100%', maxWidth: 480 }}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                borderRadius: 3,
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Mobile Branding */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CalendarIcon sx={{ fontSize: 36, mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight={700} color="primary">
                    Syncender
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="h4"
                component="h1"
                align="center"
                fontWeight={600}
                gutterBottom
                sx={{ mb: 1 }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Login to continue to your account
              </Typography>
              
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      fontSize: 24
                    }
                  }}
                >
                  {error}
                </Alert>
              )}
              
              <Stack spacing={2.5}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogle}
                  sx={{
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Continue with Google
                </Button>

                <Divider sx={{ my: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    or login with email
                  </Typography>
                </Divider>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: theme.shadows[4],
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Don't have an account? <strong>Register here</strong>
                    </Typography>
                  </Link>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;