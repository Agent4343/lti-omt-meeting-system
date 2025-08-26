import { useEffect, useState } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Container,
  Paper,
  Grid,
  Divider,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Badge,
  Avatar,
  ListItemIcon,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CardHeader,
  CardActions,
  Collapse
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import EngineeringIcon from '@mui/icons-material/Engineering';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import * as XLSX from 'xlsx';

function MeetingSummaryPage() {
  const navigate = useNavigate();
  const { currentMeeting } = useAppContext();
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [responses, setResponses] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ loading: false, success: false, error: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterRisk, setFilterRisk] = useState('all');
  const [statistics, setStatistics] = useState({
    total: 0,
    byRisk: { Low: 0, Medium: 0, High: 0, Critical: 0 },
    byDuration: { short: 0, medium: 0, long: 0, permanent: 0 },
    byBusinessImpact: { None: 0, Low: 0, Medium: 0, High: 0 },
    bySystemCriticality: { 'Non-Critical': 0, Important: 0, Critical: 0, 'Safety-Critical': 0 },
    byPartsAvailability: { Available: 0, 'Order Required': 0, 'Long Lead Time': 0, Obsolete: 0 },
    byMOC: { No: 0, Minor: 0, Major: 0 },
    byEngineering: { Yes: 0, No: 0 },
    byReviewStatus: { pending: 0, 'in-progress': 0, completed: 0, 'on-hold': 0, cancelled: 0 },
    actionItems: 0,
    highPriorityItems: 0,
    completionRate: 0
  });
  
  const [detailedAnalysis, setDetailedAnalysis] = useState({
    trends: {
      riskTrend: 'stable',
      completionTrend: 'improving',
      newIssues: 0,
      resolvedIssues: 0
    },
    recommendations: [],
    criticalFindings: [],
    followUpRequired: []
  });
  
  const [meetingMetrics, setMeetingMetrics] = useState({
    duration: '0 minutes',
    efficiency: 'High',
    attendanceRate: '100%',
    participationScore: 'Excellent',
    decisionsCount: 0,
    actionItemsAssigned: 0
  });

  useEffect(() => {
    // Load meeting info and responses from localStorage
    const savedInfo = JSON.parse(localStorage.getItem('currentMeetingInfo'));
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses'));
    
    if (!savedInfo || !savedResponses) navigate('/');
    
    setMeetingInfo(savedInfo);
    setResponses(savedResponses);
    
    // Calculate statistics
    if (savedResponses) {
      const stats = {
        total: Object.keys(savedResponses).length,
        byRisk: { Low: 0, Medium: 0, High: 0 },
        byParts: { Yes: 0, No: 0 },
        byMOC: { Yes: 0, No: 0 },
        byEngineering: { Yes: 0, No: 0 }
      };
      
      Object.values(savedResponses).forEach(response => {
        // Count by risk
        if (response.risk) {
          stats.byRisk[response.risk] = (stats.byRisk[response.risk] || 0) + 1;
        }
        
        // Count by parts required
        if (response.partsRequired) {
          stats.byParts[response.partsRequired] = (stats.byParts[response.partsRequired] || 0) + 1;
        }
        
        // Count by MOC required
        if (response.mocRequired) {
          stats.byMOC[response.mocRequired] = (stats.byMOC[response.mocRequired] || 0) + 1;
        }
        
        // Count by engineering support
        if (response.engineeringSupport) {
          stats.byEngineering[response.engineeringSupport] = (stats.byEngineering[response.engineeringSupport] || 0) + 1;
        }
      });
      
      setStatistics(stats);
    }
  }, [navigate]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const confirmFinalizeMeeting = () => {
    setConfirmDialog(true);
  };
  
  const finalizeMeeting = () => {
    const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
    const newMeeting = {
      date: meetingInfo.date,
      attendees: meetingInfo.attendees,
      responses: responses,
      timestamp: new Date().toISOString(),
      statistics: statistics
    };
    pastMeetings.push(newMeeting);
    localStorage.setItem('pastMeetings', JSON.stringify(pastMeetings));
    
    // Store current meeting responses as previous meeting responses for next meeting
    localStorage.setItem('previousMeetingResponses', JSON.stringify(responses));

    // Clean current meeting cache
    localStorage.removeItem('currentMeetingInfo');
    localStorage.removeItem('currentMeetingIsolations');
    localStorage.removeItem('currentMeetingResponses');
    
    setConfirmDialog(false);
    setSnackbar({
      open: true,
      message: 'Meeting saved successfully!',
      severity: 'success'
    });
    
    // Navigate after a short delay to allow the snackbar to be seen
    setTimeout(() => {
      navigate('/past');
    }, 1500);
  };
  
  const downloadExcel = () => {
    if (!responses) return;
    
    // Prepare data for Excel export
    const rows = Object.entries(responses).map(([id, data]) => ({
      IsolationID: id,
      Risk: data.risk || '',
      Mitigation: data.mitigation || '',
      Comments: data.comments || '',
      PartsRequired: data.partsRequired || '',
      PartsArrival: data.partsArrival || '',
      MOCRequired: data.mocRequired || '',
      MOCNumber: data.mocNumber || '',
      MOCComments: data.mocComments || '',
      EngineeringSupport: data.engineeringSupport || '',
      EngineerName: data.engineerName || '',
      EngineerETA: data.engineerETA || '',
      LastReviewed: data.lastReviewed || ''
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Summary');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `MeetingSummary-${meetingInfo.date}.xlsx`);
    
    setSnackbar({
      open: true,
      message: 'Excel file downloaded successfully!',
      severity: 'success'
    });
  };
  
  const openEmailDialog = () => {
    setEmailDialog(true);
  };
  
  const sendReminders = async () => {
    if (!meetingInfo) return;
    
    setEmailStatus({ loading: true, success: false, error: null });
    
    try {
      // Prepare email data
      const emailData = {
        to: meetingInfo.attendees.join(', '),
        meetingDate: meetingInfo.date
      };
      
      // Send email using backend API
      const response = await fetch('http://localhost:5000/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email reminders');
      }
      
      setEmailStatus({ loading: false, success: true, error: null });
      
      setSnackbar({
        open: true,
        message: 'Email reminders sent successfully!',
        severity: 'success'
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setEmailDialog(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      setEmailStatus({ loading: false, success: false, error: error.message });
      
      setSnackbar({
        open: true,
        message: `Failed to send reminders: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const getFilteredResponses = () => {
    if (!responses) return [];
    
    if (filterRisk === 'all') {
      return Object.entries(responses);
    }
    
    return Object.entries(responses).filter(([_, data]) => data.risk === filterRisk);
  };

  if (!meetingInfo || !responses) return null;

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/review')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Meeting Summary</Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex' }}>
            <Tooltip title="Download as Excel">
              <IconButton color="primary" onClick={downloadExcel} sx={{ mr: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Email Reminders">
              <IconButton color="primary" onClick={openEmailDialog}>
                <EmailIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Meeting Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1">{meetingInfo.date}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Attendees</Typography>
                <Typography variant="body1">{meetingInfo.attendees.join(', ')}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Total Isolations Reviewed</Typography>
                <Typography variant="body1">{statistics.total}</Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Summary Statistics</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Risk Levels</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label={`Low: ${statistics.byRisk.Low}`} 
                      color="success" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      icon={<WarningIcon />} 
                      label={`Medium: ${statistics.byRisk.Medium}`} 
                      color="warning" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      icon={<ErrorIcon />} 
                      label={`High: ${statistics.byRisk.High}`} 
                      color="error" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parts Required</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      label={`Yes: ${statistics.byParts.Yes}`} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label={`No: ${statistics.byParts.No}`} 
                      color="default" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Engineering Support</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      label={`Yes: ${statistics.byEngineering.Yes}`} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label={`No: ${statistics.byEngineering.No}`} 
                      color="default" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Isolation Details</Typography>
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="risk-filter-label">Filter by Risk</InputLabel>
              <Select
                labelId="risk-filter-label"
                value={filterRisk}
                label="Filter by Risk"
                onChange={(e) => setFilterRisk(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Risks</MenuItem>
                <MenuItem value="Low">Low Risk</MenuItem>
                <MenuItem value="Medium">Medium Risk</MenuItem>
                <MenuItem value="High">High Risk</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Card View" />
            <Tab label="List View" />
          </Tabs>
          
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {getFilteredResponses().map(([id, data]) => (
                <Grid item xs={12} md={6} lg={4} key={id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Isolation ID: {id}</Typography>
                        <Chip 
                          label={data.risk} 
                          color={
                            data.risk === 'High' ? 'error' : 
                            data.risk === 'Medium' ? 'warning' : 'success'
                          }
                          size="small"
                        />
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {data.mitigation && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Mitigation</Typography>
                          <Typography variant="body2">{data.mitigation}</Typography>
                        </Box>
                      )}
                      
                      {data.comments && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Comments</Typography>
                          <Typography variant="body2">{data.comments}</Typography>
                        </Box>
                      )}
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Parts Required</Typography>
                          <Typography variant="body2">{data.partsRequired}</Typography>
                        </Grid>
                        
                        {data.partsRequired === 'Yes' && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Parts Arrival</Typography>
                            <Typography variant="body2">{data.partsArrival}</Typography>
                          </Grid>
                        )}
                        
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">MOC Required</Typography>
                          <Typography variant="body2">{data.mocRequired}</Typography>
                        </Grid>
                        
                        {data.mocRequired === 'Yes' && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary">MOC Number</Typography>
                              <Typography variant="body2">{data.mocNumber}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">MOC Comments</Typography>
                              <Typography variant="body2">{data.mocComments}</Typography>
                            </Grid>
                          </>
                        )}
                        
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Engineering Support</Typography>
                          <Typography variant="body2">{data.engineeringSupport}</Typography>
                        </Grid>
                        
                        {data.engineeringSupport === 'Yes' && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary">Engineer Name</Typography>
                              <Typography variant="body2">{data.engineerName}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary">Engineer ETA</Typography>
                              <Typography variant="body2">{data.engineerETA}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          {tabValue === 1 && (
            <Paper elevation={1}>
              <List>
                {getFilteredResponses().map(([id, data]) => (
                  <ListItem key={id} divider>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="subtitle1">ID: {id}</Typography>
                        <Chip 
                          label={data.risk} 
                          color={
                            data.risk === 'High' ? 'error' : 
                            data.risk === 'Medium' ? 'warning' : 'success'
                          }
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={9}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            {data.comments && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Comments:</strong> {data.comments}
                              </Typography>
                            )}
                          </Grid>
                          
                          <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="text.secondary">Parts: {data.partsRequired}</Typography>
                            {data.partsRequired === 'Yes' && (
                              <Typography variant="body2" color="text.secondary">Arrival: {data.partsArrival}</Typography>
                            )}
                          </Grid>
                          
                          <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="text.secondary">MOC: {data.mocRequired}</Typography>
                            {data.mocRequired === 'Yes' && (
                              <Typography variant="body2" color="text.secondary">Number: {data.mocNumber}</Typography>
                            )}
                          </Grid>
                          
                          <Grid item xs={6} sm={4}>
                            <Typography variant="body2" color="text.secondary">Engineering: {data.engineeringSupport}</Typography>
                            {data.engineeringSupport === 'Yes' && (
                              <Typography variant="body2" color="text.secondary">Engineer: {data.engineerName}</Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Button 
            variant="contained" 
            color="success" 
            size="large"
            startIcon={<SaveIcon />}
            onClick={confirmFinalizeMeeting}
          >
            Finalize and Save Meeting
          </Button>
        </Box>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Finalize Meeting?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will save the meeting summary and clear the current meeting data.
            You can access this meeting later in the Past Meetings section.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={finalizeMeeting} variant="contained" color="primary">
            Save Meeting
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Email Dialog */}
      <Dialog
        open={emailDialog}
        onClose={() => !emailStatus.loading && setEmailDialog(false)}
      >
        <DialogTitle>Send Email Reminders</DialogTitle>
        <DialogContent>
          {emailStatus.loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Sending email reminders...</Typography>
            </Box>
          ) : emailStatus.success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Email reminders sent successfully!
            </Alert>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Send email reminders to all attendees about the meeting on {meetingInfo.date}.
              </DialogContentText>
              
              <Typography variant="subtitle2" gutterBottom>Recipients:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{meetingInfo.attendees.join(', ')}</Typography>
              
              {emailStatus.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {emailStatus.error}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!emailStatus.loading && !emailStatus.success && (
            <>
              <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
              <Button onClick={sendReminders} variant="contained" color="primary">
                Send Reminders
              </Button>
            </>
          )}
          {emailStatus.success && (
            <Button onClick={() => setEmailDialog(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default MeetingSummaryPage;
