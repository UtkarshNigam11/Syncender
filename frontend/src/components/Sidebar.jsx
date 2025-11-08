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
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as MatchesIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  WorkspacePremium as PremiumIcon,
  HelpOutline as HelpIcon,
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
    text: 'My Favourites',
    icon: <FavoriteIcon />,
    path: '/favourites',
    color: '#FF6B9D',
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
    text: 'Subscription',
    icon: <PremiumIcon />,
    path: '/subscription',
    color: '#FFD700',
  },
  {
    text: 'Support',
    icon: <HelpIcon />,
    path: '/support',
    color: '#FF9800',
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
  const theme = useTheme();

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
          overflowY: 'auto',
          overflowX: 'hidden',
          // Custom Scrollbar Styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.03),
            borderRadius: '10px',
            margin: '8px 0',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.2)
              : alpha(theme.palette.common.black, 0.2),
            borderRadius: '10px',
            transition: 'background 0.3s ease',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.3)
                : alpha(theme.palette.common.black, 0.3),
            },
          },
          '&::-webkit-scrollbar-thumb:active': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.4)
              : alpha(theme.palette.common.black, 0.4),
          },
          // Firefox scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: theme.palette.mode === 'dark'
            ? `${alpha(theme.palette.common.white, 0.2)} ${alpha(theme.palette.common.white, 0.05)}`
            : `${alpha(theme.palette.common.black, 0.2)} ${alpha(theme.palette.common.black, 0.03)}`,
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
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isActive(item.path) 
                  ? alpha(item.color, 0.1) 
                  : 'transparent',
                border: isActive(item.path) 
                  ? `2px solid ${alpha(item.color, 0.3)}`
                  : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.12),
                  transform: 'translateX(4px)',
                  border: `2px solid ${alpha(item.color, 0.2)}`,
                },
                '&::before': isActive(item.path) ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: item.color,
                  borderRadius: '0 4px 4px 0',
                } : {},
                '& .MuiListItemIcon-root': {
                  color: isActive(item.path) ? item.color : 'text.secondary',
                  transition: 'all 0.2s ease',
                },
                '& .MuiListItemText-primary': {
                  color: isActive(item.path) ? item.color : 'text.primary',
                  fontWeight: isActive(item.path) ? 600 : 500,
                  transition: 'all 0.2s ease',
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
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isActive(item.path) 
                  ? alpha(item.color, 0.1) 
                  : 'transparent',
                border: isActive(item.path) 
                  ? `2px solid ${alpha(item.color, 0.3)}`
                  : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.12),
                  transform: 'translateX(4px)',
                  border: `2px solid ${alpha(item.color, 0.2)}`,
                },
                '&::before': isActive(item.path) ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: item.color,
                  borderRadius: '0 4px 4px 0',
                } : {},
                '& .MuiListItemIcon-root': {
                  color: isActive(item.path) ? item.color : 'text.secondary',
                  transition: 'all 0.2s ease',
                },
                '& .MuiListItemText-primary': {
                  color: isActive(item.path) ? item.color : 'text.primary',
                  fontWeight: isActive(item.path) ? 600 : 500,
                  transition: 'all 0.2s ease',
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
      <Box sx={{ m: 2, mt: 'auto', mb: 3 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>
            Sports Tracked
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            42
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            Events this month
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
