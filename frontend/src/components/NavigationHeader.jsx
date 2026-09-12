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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  useMediaQuery,
  useTheme,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert
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
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { APP_NAME, APP_VERSION } from '../config';
import { useAppContext } from '../context/AppContext';

function NavigationHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'));

  const { storageStatus, syncToSharePoint } = useAppContext();

  // `primary` items stay inline on wide screens; the rest live in the drawer.
  // All nine rendered inline overflowed the toolbar and wrapped onto three
  // lines even at 1440px.
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'New Meeting', icon: <AddIcon />, path: '/home', primary: true },
    { text: 'Manage People', icon: <PeopleIcon />, path: '/people' },
    { text: 'Past Meetings', icon: <HistoryIcon />, path: '/past', primary: true },
    { text: 'LTI Master List', icon: <ListAltIcon />, path: '/lti-master', primary: true },
    { text: 'LTI Dashboard', icon: <DashboardIcon />, path: '/lti-dashboard' },
    { text: 'Operations Manager', icon: <SupervisorAccountIcon />, path: '/operations-manager-dashboard', primary: true },
    { text: 'Removed LTIs', icon: <DeleteSweepIcon />, path: '/removed-ltis' },
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

  // Handle SharePoint sync
  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      const result = await syncToSharePoint();
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Data synced to SharePoint successfully!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'SharePoint sync failed',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error syncing to SharePoint: ' + error.message,
        severity: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const isSharePointConnected = storageStatus?.sharePointAvailable;

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
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '&:hover': { bgcolor: 'action.selected' },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" sx={{ mb: 3 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <IconButton
            size="medium"
            edge="start"
            color="inherit"
            aria-label="Open navigation menu"
            sx={{ mr: 1.5 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            component="div"
            noWrap
            sx={{ cursor: 'pointer', mr: 2, fontWeight: 700, letterSpacing: '-0.01em' }}
            onClick={() => navigate('/')}
          >
            {APP_NAME}
          </Typography>

          {/* SharePoint Sync Button */}
          <Tooltip title={isSharePointConnected ? "Sync to SharePoint" : "SharePoint not connected"}>
            <span>
              <IconButton
                color="inherit"
                onClick={handleSync}
                disabled={!isSharePointConnected || syncing}
                sx={{ mr: 1 }}
              >
                {syncing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isSharePointConnected ? (
                  <CloudSyncIcon />
                ) : (
                  <CloudOffIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          {!isCompact && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {menuItems.filter(item => item.primary).map((item) => (
                <Button
                  key={item.text}
                  color={isActive(item.path) ? 'primary' : 'inherit'}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    whiteSpace: 'nowrap',
                    fontWeight: isActive(item.path) ? 700 : 500,
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                    bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' }
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

      {/* Sync Status Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
}

export default NavigationHeader;
