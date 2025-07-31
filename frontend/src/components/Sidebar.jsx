import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Sports as SportsIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as MatchesIcon,
  TrendingUp as TrendingIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    color: '#1565C0',
  },
  {
    text: 'Sports',
    icon: <SportsIcon />,
    path: '/sports',
    color: '#FF5722',
  },
  {
    text: 'Matches',
    icon: <MatchesIcon />,
    path: '/matches',
    color: '#4CAF50',
  },
  {
    text: 'My Calendar',
    icon: <CalendarIcon />,
    path: '/calendar',
    color: '#9C27B0',
  },
];

const secondaryItems = [
  {
    text: 'Trending',
    icon: <TrendingIcon />,
    path: '/trending',
    color: '#FF9800',
  },
  {
    text: 'Favorites',
    icon: <FavoriteIcon />,
    path: '/favorites',
    color: '#E91E63',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#607D8B',
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Main Menu
        </Typography>
      </Box>

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                backgroundColor: isActive(item.path) 
                  ? alpha(item.color, 0.1) 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.08),
                },
                '& .MuiListItemIcon-root': {
                  color: isActive(item.path) ? item.color : 'text.secondary',
                },
                '& .MuiListItemText-primary': {
                  color: isActive(item.path) ? item.color : 'text.primary',
                  fontWeight: isActive(item.path) ? 600 : 400,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ px: 3, py: 2 }}>
        <Divider />
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Discover
        </Typography>
      </Box>

      <List sx={{ px: 2 }}>
        {secondaryItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                backgroundColor: isActive(item.path) 
                  ? alpha(item.color, 0.1) 
                  : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.08),
                },
                '& .MuiListItemIcon-root': {
                  color: isActive(item.path) ? item.color : 'text.secondary',
                },
                '& .MuiListItemText-primary': {
                  color: isActive(item.path) ? item.color : 'text.primary',
                  fontWeight: isActive(item.path) ? 600 : 400,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Quick Stats Card */}
      <Box sx={{ m: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Sports Tracked
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            42
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Events this month
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
