import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Pages
import Dashboard from './pages/Dashboard';
import Sports from './pages/Sports';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import Calendar from './pages/Calendar';
import TestCricketMatch from './pages/TestCricketMatch';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',
      light: '#42A5F5',
      dark: '#0D47A1',
    },
    secondary: {
      main: '#FF5722',
      light: '#FF8A65',
      dark: '#D84315',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
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
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/test-cricket" element={<TestCricketMatch />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;