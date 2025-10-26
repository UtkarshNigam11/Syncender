import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const lightTheme = createTheme({
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
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    components: {
      // Remove global AppBar background override to ensure proper contrast when using color="default"
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: undefined
          }
        }
      }
    }
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#42A5F5',
        light: '#90CAF9',
        dark: '#1565C0',
      },
      secondary: {
        main: '#FF7043',
        light: '#FFAB91',
        dark: '#D84315',
      },
      background: {
        default: '#1a1a1a',
        paper: '#242424',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
    },
    components: {
      // Remove global AppBar background override for dark as well
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: undefined,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#2d2d2d',
            borderColor: '#3a3a3a',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            '&.MuiChip-colorError': {
              backgroundColor: '#d32f2f',
              color: '#ffffff',
            },
          },
        },
      },
    },
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
