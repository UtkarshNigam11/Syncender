import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Context
import { CustomThemeProvider, useTheme } from './context/ThemeContext';

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

function AppContent() {
  const { theme } = useTheme();

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

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App;