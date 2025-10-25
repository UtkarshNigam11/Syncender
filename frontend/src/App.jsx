import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Context
import { CustomThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Sports from './pages/Sports';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import Calendar from './pages/Calendar';
import TestCricketMatch from './pages/TestCricketMatch';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';

function OAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = React.useContext(AuthContext);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      // Use AuthContext to persist and set default headers
      loginWithToken(token).then(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate, loginWithToken]);

  return null;
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {/* Opt-in to v7 behavior to silence warnings */}
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default' }}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/sports" element={<Sports />} />
                  <Route path="/teams/:sportId" element={<Teams />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/matches/:teamId" element={<Matches />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/test-cricket" element={<TestCricketMatch />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/auth/google/callback" element={<OAuthHandler />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App;