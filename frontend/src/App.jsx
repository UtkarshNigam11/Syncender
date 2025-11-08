import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Context
import { CustomThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Favourites from './pages/Favourites';
import Matches from './pages/Matches';
import Calendar from './pages/Calendar';
import TestCricketMatch from './pages/TestCricketMatch';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminEvents from './pages/admin/AdminEvents';
import AdminSportsManagement from './pages/admin/AdminSportsManagement';
import AdminMonitoring from './pages/admin/AdminMonitoring';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNotifications from './pages/admin/AdminNotifications';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdminLayout from './components/admin/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminPrivateRoute from './components/admin/AdminPrivateRoute';

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

function AppLayout() {
  const location = useLocation();
  
  // Routes that should NOT show navbar/sidebar (public routes)
  const publicRoutes = ['/login', '/register', '/auth/google/callback'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Admin panel routes (with admin sidebar)
  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminPrivateRoute>
                <AdminLayout />
              </AdminPrivateRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="sports" element={<AdminSportsManagement />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="monitoring" element={<AdminMonitoring />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    );
  }

  if (isPublicRoute) {
    // Render only the page content without navbar/sidebar
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<OAuthHandler />} />
      </Routes>
    );
  }

  // Render with navbar/sidebar for authenticated routes
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, p: 2, backgroundColor: 'background.default' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Favourites page - consolidated Sports + Teams selection */}
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/teams" element={<Navigate to="/favourites" replace />} /> {/* Redirect old route */}
            <Route path="/sports" element={<Navigate to="/favourites" replace />} /> {/* Redirect old route */}
            <Route path="/matches" element={<Matches />} />
            <Route path="/matches/:teamId" element={<Matches />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/test-cricket" element={<TestCricketMatch />} />
            <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {/* Opt-in to v7 behavior to silence warnings */}
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout />
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