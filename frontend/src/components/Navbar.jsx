import React, { useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Box,
  Menu,
  MenuItem,
  Chip,
  InputBase,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AccountCircle,
  CalendarToday,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.grey[900], 0.06),
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.12)
        : alpha(theme.palette.grey[900], 0.12),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchorEl(null);
  };

  const goTo = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const getInitials = (s) => {
    if (!s) return 'U';
    const parts = s.replace(/[^a-zA-Z ]/g, '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return s[0]?.toUpperCase() || 'U';
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const avatarLabel = user?.name || user?.email || 'User';
  const avatarText = getInitials(user?.name || user?.email);

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <CalendarToday sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1, maxWidth: { xs: 140, sm: 220, md: 280 } }}
            title="SportsCalendar"
          >
            SportsCalendar
          </Typography>
          <Chip
            label="Pro"
            size="small"
            sx={{
              backgroundColor: 'secondary.main',
              color: 'common.white',
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Make search grow and have a reasonable max width */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 420, md: 560 }, mx: 2 }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search teams, players, matches..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            aria-label="toggle dark mode"
            color="inherit"
            onClick={toggleDarkMode}
            sx={{
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'rotate(12deg)',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Tooltip title={avatarLabel} arrow>
              <Avatar sx={{
                width: 36,
                height: 36,
                bgcolor: isDarkMode ? 'primary.dark' : 'primary.main',
                color: 'primary.contrastText',
                border: '2px solid',
                borderColor: isDarkMode ? 'primary.light' : 'primary.light',
                fontWeight: 700,
                fontSize: 14,
              }}>
                {avatarText}
              </Avatar>
            </Tooltip>
          </IconButton>
        </Box>

        <Menu
          id="primary-search-account-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => goTo('/profile')}>Profile</MenuItem>
          <MenuItem onClick={() => goTo('/calendar')}>My Calendar</MenuItem>
          <MenuItem onClick={() => goTo('/settings')}>Settings</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>

        <Menu
          id="notification-menu"
          anchorEl={notificationAnchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>🏀 Lakers vs Warriors - Tonight 8PM</MenuItem>
          <MenuItem onClick={handleMenuClose}>🏈 NFL Game Alert - Tomorrow</MenuItem>
          <MenuItem onClick={handleMenuClose}>🏏 India vs Australia - Live Now</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;