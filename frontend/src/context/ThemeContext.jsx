import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

// Provide a safe default context to avoid runtime crashes showing a white screen
const defaultTheme = createTheme();
const ThemeContext = createContext({
  isDarkMode: false,
  themeMode: 'light',
  setThemeMode: () => {},
  toggleDarkMode: () => {},
  accent: 'blue',
  setAccent: () => {},
  theme: defaultTheme,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Normalize external strings into supported modes
function normalizeMode(mode) {
  const m = String(mode || '').toLowerCase();
  if (m === 'day' || m === 'light') return 'light';
  if (m === 'dark') return 'dark';
  if (m === 'system') return 'system';
  return 'light'; // safe default
}

export const CustomThemeProvider = ({ children }) => {
  // Theme mode: 'system' | 'light' | 'dark' (accept 'day' as alias of 'light')
  const [themeMode, _setThemeMode] = useState(() => normalizeMode(localStorage.getItem('themeMode') || 'system'));
  // Accent color: choose from palette keys
  const [accent, setAccent] = useState(() => localStorage.getItem('accentColor') || 'blue');
  // Density: 'comfortable' | 'compact' (default to compact to reduce overall sizes)
  const [density, setDensity] = useState(() => localStorage.getItem('density') || 'compact');

  // Persist normalized theme mode
  useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
  useEffect(() => { localStorage.setItem('accentColor', accent); }, [accent]);
  useEffect(() => { localStorage.setItem('density', density); }, [density]);

  // Resolve system preference
  const prefersDark = useMemo(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches, []);
  const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark);

  // Safe setter that normalizes inputs like 'day' => 'light'
  const setThemeMode = (mode) => _setThemeMode(prev => normalizeMode(typeof mode === 'function' ? mode(prev) : mode));

  // Provide a simple toggle used by Navbar
  const toggleDarkMode = () => setThemeMode(isDark ? 'light' : 'dark');

  const primaryMap = {
    blue: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    purple: { main: '#7e57c2', light: '#b39ddb', dark: '#5e35b1' },
    green: { main: '#2e7d32', light: '#66bb6a', dark: '#1b5e20' },
    orange: { main: '#ef6c00', light: '#ffb74d', dark: '#e65100' },
    red: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
  };
  const primary = primaryMap[accent] || primaryMap.blue;

  const baseTheme = useMemo(() => {
    const palette = {
      mode: isDark ? 'dark' : 'light',
      primary,
      secondary: { main: isDark ? '#FF7043' : '#FF5722' },
      background: isDark
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f5f5f5', paper: '#ffffff' },
    };
    if (isDark) {
      palette.text = { primary: '#ffffff', secondary: '#b0b0b0' };
    }

    // Density-based spacing
    const spacing = density === 'compact' ? 6 : 8;

    const components = {
      MuiAppBar: { styleOverrides: { root: { background: undefined } } },
      MuiChip: {
        styleOverrides: {
          root: { '&.MuiChip-colorError': { backgroundColor: '#d32f2f', color: '#ffffff' } },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiFormControl: { styleOverrides: { root: { marginTop: spacing / 2, marginBottom: spacing / 2 } } },
      MuiInputBase: { styleOverrides: { input: { padding: density === 'compact' ? '6px 8px' : '10px 14px' } } },
      MuiGrid: { styleOverrides: { root: { marginTop: spacing / 2, marginBottom: spacing / 2 } } },
    };
    if (isDark) {
      components.MuiCard = { styleOverrides: { root: { backgroundColor: '#2a2a2a', borderColor: '#404040' } } };
    }

    // Slightly reduce overall typography scale for a less "zoomed" look
    const typography = {
      fontSize: 13, // default is 14 — reduce globally
    };

    return createTheme({ palette, components, spacing, typography });
  }, [isDark, accent, density]);

  return (
    <ThemeContext.Provider value={{
      isDarkMode: isDark,
      themeMode,
      setThemeMode,
      toggleDarkMode,
      accent,
      setAccent,
      density,
      setDensity,
      theme: baseTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
