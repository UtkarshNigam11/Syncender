import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  // Theme mode: 'system' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'system');
  // Accent color: choose from palette keys
  const [accent, setAccent] = useState(() => localStorage.getItem('accentColor') || 'blue');

  useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
  useEffect(() => { localStorage.setItem('accentColor', accent); }, [accent]);

  // Resolve system preference
  const prefersDark = useMemo(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches, []);
  const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark);

  const primaryMap = {
    blue: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    purple: { main: '#7e57c2', light: '#b39ddb', dark: '#5e35b1' },
    green: { main: '#2e7d32', light: '#66bb6a', dark: '#1b5e20' },
    orange: { main: '#ef6c00', light: '#ffb74d', dark: '#e65100' },
    red: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
  };
  const primary = primaryMap[accent] || primaryMap.blue;

  const baseTheme = useMemo(() => createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary,
      secondary: { main: isDark ? '#FF7043' : '#FF5722' },
      background: isDark ? {
        default: '#121212',
        paper: '#1e1e1e',
      } : {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      text: isDark ? {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      } : undefined,
    },
    components: {
      MuiAppBar: { styleOverrides: { root: { background: undefined } } },
      MuiCard: isDark ? { styleOverrides: { root: { backgroundColor: '#2a2a2a', borderColor: '#404040' } } } : undefined,
      MuiChip: {
        styleOverrides: { root: { '&.MuiChip-colorError': { backgroundColor: '#d32f2f', color: '#ffffff' } } }
      },
      MuiButton: { defaultProps: { disableElevation: true } },
    },
  }), [isDark, accent]);

  return (
    <ThemeContext.Provider value={{
      isDarkMode: isDark,
      themeMode,
      setThemeMode,
      accent,
      setAccent,
      theme: baseTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
