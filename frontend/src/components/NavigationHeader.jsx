import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { APP_NAME, APP_VERSION } from '../config';

function NavigationHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

   const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'New Meeting', icon: <AddIcon />, path: '/home' },
    { text: 'Manage People', icon: <PeopleIcon />, path: '/people' },
    { text: 'Past Meetings', icon: <HistoryIcon />, path: '/past' },
    { text: 'LTI Master List', icon: <ListAltIcon />, path: '/lti-master' },
    { text: 'LTI Dashboard', icon: <DashboardIcon />, path: '/lti-dashboard' },
    { text: 'Asset Manager Review', icon: <BusinessIcon />, path: '/asset-manager-review' },
    { text: 'Asset Manager Dashboard', icon: <SupervisorAccountIcon />, path: '/asset-manager-dashboard' },
    { text: 'Meeting Calendar', icon: <CalendarMonthIcon />, path: '/calendar' },
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">{APP_NAME}</Typography>
        <Typography variant="caption">v{APP_VERSION}</Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={isActive(item.path)}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            {APP_NAME}
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    mx: 1,
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                    borderRadius: 0,
                    paddingBottom: '4px'
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </Container>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}

export default NavigationHeader;
