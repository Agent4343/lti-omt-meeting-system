import { 
  Button, 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Paper,
  Divider,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EmailIcon from '@mui/icons-material/Email';
import { APP_NAME, APP_VERSION } from '../config';

function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      title: 'Track Isolations',
      description: 'Upload and track isolation lists with automatic comparison to identify new and removed items.',
      icon: <CompareArrowsIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
    },
    {
      title: 'Detailed Reviews',
      description: 'Conduct thorough reviews of each isolation with risk assessment, parts tracking, and engineering support.',
      icon: <AssessmentIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
    },
    {
      title: 'Email Notifications',
      description: 'Send email reminders to attendees with meeting details and action items.',
      icon: <EmailIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 4, md: 6 }, 
          mt: 4, 
          mb: 6, 
          borderRadius: 4,
          background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white'
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              {APP_NAME}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Streamline your isolation tracking, review process, and meeting management with our comprehensive system.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/home')}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              >
                Start New Meeting
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/past')}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                View Past Meetings
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%'
              }}
            >
              <AssessmentIcon sx={{ fontSize: 200, opacity: 0.8 }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Features Section */}
      <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
        Key Features
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
        Our system provides everything you need to manage your isolation meetings efficiently
      </Typography>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom textAlign="center">
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 6, borderRadius: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom textAlign="center">
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                },
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <AddIcon fontSize="large" />
                </Box>
                <Typography variant="h6" component="h3" gutterBottom textAlign="center">
                  New Meeting
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                  Create a new meeting and upload isolation list
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/home')}
                  sx={{ 
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                >
                  Start Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.background.paper,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                },
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <PeopleIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h6" component="h3" gutterBottom textAlign="center">
                  Manage People
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Add, edit, or remove people from your attendee list
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/people')}
                >
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                bgcolor: theme.palette.background.paper,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                },
                height: '100%'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <HistoryIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h6" component="h3" gutterBottom textAlign="center">
                  Past Meetings
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  View and export data from previous meetings
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/past')}
                >
                  View
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
        <Typography variant="caption">
          {APP_NAME} v{APP_VERSION} | LTI Isolation Management System
        </Typography>
      </Box>
    </Container>
  );
}

export default LandingPage;
