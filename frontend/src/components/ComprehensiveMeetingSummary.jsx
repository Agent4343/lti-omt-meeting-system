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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Avatar,
  ListItemIcon,
  CardHeader
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
import PrintIcon from '@mui/icons-material/Print';

function ComprehensiveMeetingSummary() {
  const navigate = useNavigate();
  const { currentMeeting } = useAppContext();
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [responses, setResponses] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Simplified meeting data
  const [meetingData, setMeetingData] = useState({
    executiveSummary: {
      totalIsolationsReviewed: 0,
      criticalFindings: 0,
      actionItemsGenerated: 0,
      meetingEfficiencyScore: 95
    },
    riskAnalysis: {
      distribution: {
        Critical: { count: 0, percentage: 0 },
        High: { count: 0, percentage: 0 },
        Medium: { count: 0, percentage: 0 },
        Low: { count: 0, percentage: 0 }
      }
    }
  });

  useEffect(() => {
    // Load meeting info and responses from localStorage
    const savedInfo = JSON.parse(localStorage.getItem('currentMeetingInfo'));
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses'));
    const savedIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations'));
    
    if (!savedInfo || !savedIsolations) {
      navigate('/');
      return;
    }
    
    setMeetingInfo(savedInfo);
    setResponses(savedResponses || {});
    
    // Calculate basic statistics
    calculateMeetingData(savedResponses || {}, savedInfo, savedIsolations);
    
  }, [navigate]);
  
  const calculateMeetingData = (responses, meetingInfo, isolations) => {
    // Use isolations array length as the primary source of truth for total count
    const total = isolations ? isolations.length : 0;
    
    // Count actual action items from responses
    let totalActionItems = 0;
    let criticalCount = 0;
    let reviewedCount = 0;
    let relatedIsolationWarnings = [];
    
    // Function to check for related isolations based on first 3 digits after CAHE-
    const checkForRelatedIsolations = (isolations, currentIsolation) => {
      const related = isolations.filter(isolation => {
        if (isolation.id === currentIsolation.id) return false;
        
        // Extract first 3 digits after CAHE- for both isolations
        const currentMatch = currentIsolation.id.match(/CAHE-(\d{3})/);
        const isolationMatch = isolation.id.match(/CAHE-(\d{3})/);
        
        if (currentMatch && isolationMatch) {
          return currentMatch[1] === isolationMatch[1];
        }
        return false;
      });
      return related;
    };
    
    // Count responses that actually exist (isolations that were reviewed)
    if (responses && typeof responses === 'object') {
      reviewedCount = Object.keys(responses).length;
      
      Object.values(responses).forEach(response => {
        // Count action items for this isolation
        if (response.actionItems && Array.isArray(response.actionItems)) {
          totalActionItems += response.actionItems.length;
        }
        
        // Count critical findings (check both riskLevel and risk fields, include High as critical)
        const riskLevel = response.riskLevel || response.risk;
        if (riskLevel === 'Critical' || riskLevel === 'High') {
          criticalCount++;
        }
      });
      
      // Check for related isolation warnings
      if (isolations && Array.isArray(isolations)) {
        isolations.forEach(isolation => {
          const relatedIsolations = checkForRelatedIsolations(isolations, isolation);
          if (relatedIsolations.length > 0) {
            relatedIsolationWarnings.push({
              isolationId: isolation.id,
              isolationDescription: isolation.description || isolation.Title || 'No description',
              relatedCount: relatedIsolations.length,
              relatedIds: relatedIsolations.map(rel => rel.id)
            });
          }
        });
      }
    }
    
    // Use the higher of total isolations loaded or responses saved
    const actualTotal = Math.max(total, reviewedCount);
    
    const data = {
      executiveSummary: {
        totalIsolationsReviewed: actualTotal,
        criticalFindings: criticalCount,
        actionItemsGenerated: totalActionItems,
        meetingEfficiencyScore: 95,
        relatedIsolationWarnings: relatedIsolationWarnings
      },
      riskAnalysis: {
        distribution: {
          Critical: { count: 0, percentage: 0 },
          High: { count: 0, percentage: 0 },
          Medium: { count: 0, percentage: 0 },
          Low: { count: 0, percentage: 0 }
        }
      }
    };
    
    // Calculate actual risk distribution from responses
    if (responses && typeof responses === 'object') {
      Object.values(responses).forEach(response => {
        let risk = 'Low'; // default
        if (response.riskLevel) {
          risk = response.riskLevel === 'N/A' ? 'Low' : response.riskLevel;
        }
        
        if (data.riskAnalysis.distribution[risk]) {
          data.riskAnalysis.distribution[risk].count++;
        }
      });
    }
    
    // Calculate percentages for risk distribution based on reviewed count
    Object.keys(data.riskAnalysis.distribution).forEach(risk => {
      data.riskAnalysis.distribution[risk].percentage = reviewedCount > 0 ? 
        Math.round((data.riskAnalysis.distribution[risk].count / reviewedCount) * 100) : 0;
    });
    
    console.log('Meeting Data Calculation:', {
      totalIsolations: total,
      reviewedCount: reviewedCount,
      actualTotal: actualTotal,
      criticalCount: criticalCount,
      responses: responses ? Object.keys(responses) : 'none'
    });
    
    setMeetingData(data);
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const confirmFinalizeMeeting = () => {
    setConfirmDialog(true);
  };
  
  const finalizeMeeting = () => {
    const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
    const savedIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations')) || [];
    
    // Create comprehensive meeting summary with all isolation data
    const meeting = {
      date: meetingInfo.date,
      attendees: meetingInfo.attendees,
      responses: responses,
      isolations: savedIsolations, // Include full isolation data with titles/descriptions
      timestamp: new Date().toISOString(),
      meetingData: meetingData,
      version: '4.0' // Updated version to indicate enhanced data structure
    };
    pastMeetings.push(meeting);
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
      message: 'Meeting summary saved successfully!',
      severity: 'success'
    });
    
    // Navigate after a short delay
    setTimeout(() => {
      navigate('/past');
    }, 1500);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!meetingInfo || !responses) return null;

  return (
    <Container maxWidth="xl">
      {/* Header Section */}
      <Paper elevation={3} sx={{ 
        p: 4, 
        mt: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: 3
      }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/review')} sx={{ mr: 2, color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              📊 Meeting Summary
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Complete Analysis & Strategic Recommendations for {meetingInfo.date}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Print Summary">
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }} 
                onClick={() => window.print()}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Executive Summary Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AssignmentIcon sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {meetingData.executiveSummary.totalIsolationsReviewed}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Total Isolations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ErrorIcon sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {meetingData.executiveSummary.criticalFindings}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Critical Findings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {meetingData.executiveSummary.actionItemsGenerated}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Action Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 56, mb: 2 }} />
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {meetingData.executiveSummary.meetingEfficiencyScore}%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Efficiency Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Tabs */}
      <Paper elevation={3} sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 72, py: 2 }
          }}
        >
          <Tab icon={<AssignmentIcon />} label="Executive Summary" />
          <Tab icon={<ErrorIcon />} label="Risk Analysis" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 4 }}>
          {/* Tab 0: Executive Summary */}
          {tabValue === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Card elevation={2} sx={{ mb: 3 }}>
                  <CardHeader 
                    title="📋 Meeting Overview"
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><CalendarTodayIcon /></Avatar>}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" color="primary" gutterBottom>Meeting Details</Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon><CalendarTodayIcon color="primary" /></ListItemIcon>
                            <ListItemText primary="Date" secondary={meetingInfo.date} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                            <ListItemText primary="Attendees" secondary={`${meetingInfo.attendees.length} participants`} />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Related Isolation Warnings Section */}
                {meetingData.executiveSummary.relatedIsolationWarnings && meetingData.executiveSummary.relatedIsolationWarnings.length > 0 && (
                  <Card elevation={2} sx={{ mb: 3 }}>
                    <CardHeader 
                      title="⚠️ Related Isolation Warnings"
                      avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><WarningIcon /></Avatar>}
                    />
                    <CardContent>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          System Relationship Alerts Detected
                        </Typography>
                        <Typography variant="body2">
                          The following isolations share system prefixes, indicating potential related equipment and additional risks requiring consideration.
                        </Typography>
                      </Alert>
                      
                      {meetingData.executiveSummary.relatedIsolationWarnings.map((warning, index) => (
                        <Box key={index} sx={{ 
                          mb: 2, 
                          p: 2, 
                          border: '1px solid #ff9800', 
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 152, 0, 0.05)'
                        }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                            {warning.isolationId}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {warning.isolationDescription}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Related Isolations ({warning.relatedCount}):</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {warning.relatedIds.map(relatedId => (
                              <Chip
                                key={relatedId}
                                label={relatedId}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Isolation Review Section */}
                <Card elevation={2}>
                  <CardHeader 
                    title="📝 Detailed Isolation Review"
                    avatar={<Avatar sx={{ bgcolor: 'info.main' }}><AssignmentIcon /></Avatar>}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Complete review of all isolations discussed in this meeting
                    </Typography>
                    
                    {/* Get all isolations from localStorage and display them */}
                    {(() => {
                      const savedIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations')) || [];
                      const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};
                      
                      // Function to check for related isolations based on first 3 digits after CAHE-
                      const checkForRelatedIsolations = (isolations, currentIsolation) => {
                        const related = isolations.filter(isolation => {
                          if (isolation.id === currentIsolation.id) return false;
                          
                          // Extract first 3 digits after CAHE- for both isolations
                          const currentMatch = currentIsolation.id.match(/CAHE-(\d{3})/);
                          const isolationMatch = isolation.id.match(/CAHE-(\d{3})/);
                          
                          if (currentMatch && isolationMatch) {
                            return currentMatch[1] === isolationMatch[1];
                          }
                          return false;
                        });
                        return related;
                      };
                      
                      return savedIsolations.map((isolation, index) => {
                        const response = savedResponses[isolation.id] || {};
                        const riskLevel = response.riskLevel || 'N/A';
                        const comments = response.comments || '';
                        const actionItems = response.actionItems || [];
                        
                        // Check for related isolations
                        const relatedIsolations = checkForRelatedIsolations(savedIsolations, isolation);
                        
                        const getRiskColor = (risk) => {
                          switch (risk) {
                            case 'Low': return 'success';
                            case 'Medium': return 'warning';
                            case 'High': return 'error';
                            case 'Critical': return 'error';
                            case 'N/A': return 'default';
                            default: return 'default';
                          }
                        };

                        return (
                          <Accordion key={isolation.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                                  {isolation.id} - {isolation.description || isolation.Title || isolation.title || 'No description'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  {relatedIsolations.length > 0 && (
                                    <Tooltip title={`Warning: ${relatedIsolations.length} related isolation(s) detected with same system prefix`}>
                                      <Chip 
                                        icon={<WarningIcon />}
                                        label={`${relatedIsolations.length} Related`}
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Tooltip>
                                  )}
                                  <Chip 
                                    label={riskLevel} 
                                    color={getRiskColor(riskLevel)}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                {/* Related Isolations Warning */}
                                {relatedIsolations.length > 0 && (
                                  <Grid item xs={12}>
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        ⚠️ Warning: Related Isolations Detected
                                      </Typography>
                                      <Typography variant="body2" gutterBottom>
                                        This isolation shares the same system prefix (first 3 digits after CAHE-) with {relatedIsolations.length} other isolation(s).
                                        This may indicate related equipment and potential additional risks that need consideration.
                                      </Typography>
                                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {relatedIsolations.map(relatedIsolation => (
                                          <Chip
                                            key={relatedIsolation.id}
                                            label={relatedIsolation.id}
                                            size="small"
                                            variant="outlined"
                                            color="warning"
                                          />
                                        ))}
                                      </Box>
                                    </Alert>
                                  </Grid>
                                )}
                                
                                {/* Core Assessment - Left Column */}
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                    📊 Core Assessment
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <strong>Risk Level:</strong> {riskLevel}
                                  </Typography>
                                  {/* Risk Level Comment */}
                                  {response.riskLevelComment && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic', bgcolor: '#f8f9fa', p: 1, borderRadius: 1, border: '1px solid #e9ecef' }}>
                                      <strong>Risk Assessment:</strong> {response.riskLevelComment}
                                    </Typography>
                                  )}
                                  
                                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                                    <strong>MOC Required:</strong> {response.mocRequired || 'N/A'}
                                  </Typography>
                                  {/* MOC Required Comment */}
                                  {response.mocRequiredComment && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic', bgcolor: '#f8f9fa', p: 1, borderRadius: 1, border: '1px solid #e9ecef' }}>
                                      <strong>MOC Justification:</strong> {response.mocRequiredComment}
                                    </Typography>
                                  )}
                                  
                                  {/* MOC Number */}
                                  {response.mocNumber && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2 }}>
                                      <strong>MOC Number:</strong> {response.mocNumber}
                                    </Typography>
                                  )}
                                  
                                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                                    <strong>Action Required:</strong> {response.actionRequired || 'N/A'}
                                  </Typography>
                                  {/* Action Required Comment */}
                                  {response.actionRequiredComment && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic', bgcolor: '#f8f9fa', p: 1, borderRadius: 1, border: '1px solid #e9ecef' }}>
                                      <strong>Action Plan:</strong> {response.actionRequiredComment}
                                    </Typography>
                                  )}
                                </Grid>
                                
                                {/* LTI Information - Right Column */}
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.main', mb: 1 }}>
                                    📅 LTI Information
                                  </Typography>
                                  
                                  {/* LTI Age Display */}
                                  {(() => {
                                    const plannedStartDate = isolation['Planned Start Date'] || isolation.plannedStartDate || isolation.PlannedStartDate;
                                    if (plannedStartDate) {
                                      const calculateLTIAge = (startDate) => {
                                        try {
                                          const start = new Date(startDate);
                                          const current = new Date();
                                          const diffTime = Math.abs(current - start);
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                          
                                          if (diffDays < 30) {
                                            return `${diffDays} days`;
                                          } else if (diffDays < 365) {
                                            const months = Math.floor(diffDays / 30);
                                            return `${months} month${months > 1 ? 's' : ''}`;
                                          } else {
                                            const years = Math.floor(diffDays / 365);
                                            const remainingMonths = Math.floor((diffDays % 365) / 30);
                                            return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
                                          }
                                        } catch (error) {
                                          return 'Invalid Date';
                                        }
                                      };
                                      const age = calculateLTIAge(plannedStartDate);
                                      const ageColor = age.includes('year') || (age.includes('month') && parseInt(age) >= 6) ? 'error.main' : 'text.secondary';
                                      return (
                                        <Typography variant="body2" color={ageColor} gutterBottom sx={{ fontWeight: age.includes('year') || (age.includes('month') && parseInt(age) >= 6) ? 'bold' : 'normal' }}>
                                          <strong>LTI Age:</strong> {age}
                                          {(age.includes('year') || (age.includes('month') && parseInt(age) >= 6)) && (
                                            <Chip label="6+ MONTHS" color="warning" size="small" sx={{ ml: 1 }} />
                                          )}
                                        </Typography>
                                      );
                                    }
                                    return (
                                      <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>LTI Age:</strong> Unknown
                                      </Typography>
                                    );
                                  })()}
                                  
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <strong>System/Equipment:</strong> {isolation['System/Equipment'] || isolation.systemEquipment || 'N/A'}
                                  </Typography>
                                  
                                  {(() => {
                                    const plannedStartDate = isolation['Planned Start Date'] || isolation.plannedStartDate || isolation.PlannedStartDate;
                                    if (plannedStartDate) {
                                      return (
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Start Date:</strong> {new Date(plannedStartDate).toLocaleDateString()}
                                        </Typography>
                                      );
                                    }
                                    return null;
                                  })()}
                                </Grid>
                                
                                {/* WMS Manual Risk Assessment Section */}
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                                    WMS Manual Risk Assessment
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Corrosion Risk:</strong> {response.corrosionRisk || 'N/A'}
                                      </Typography>
                                      {/* Corrosion Risk Comment */}
                                      {response.corrosionRiskComment && (
                                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic' }}>
                                          <strong>Corrosion Comment:</strong> {response.corrosionRiskComment}
                                        </Typography>
                                      )}
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Dead Legs Risk:</strong> {response.deadLegsRisk || 'N/A'}
                                      </Typography>
                                      {/* Dead Legs Risk Comment */}
                                      {response.deadLegsRiskComment && (
                                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic' }}>
                                          <strong>Dead Legs Comment:</strong> {response.deadLegsRiskComment}
                                        </Typography>
                                      )}
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Automation Loss Risk:</strong> {response.automationLossRisk || 'N/A'}
                                      </Typography>
                                      {/* Automation Loss Risk Comment */}
                                      {response.automationLossRiskComment && (
                                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: 2, fontStyle: 'italic' }}>
                                          <strong>Automation Comment:</strong> {response.automationLossRiskComment}
                                        </Typography>
                                      )}
                                    </Grid>
                                  </Grid>
                                </Grid>
                                
                                {comments && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      <strong>Comments:</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      bgcolor: '#f5f5f5', 
                                      p: 1, 
                                      borderRadius: 1,
                                      fontStyle: 'italic'
                                    }}>
                                      {comments}
                                    </Typography>
                                  </Grid>
                                )}
                                
                                {actionItems && actionItems.length > 0 && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      <strong>Action Items:</strong>
                                    </Typography>
                                    {actionItems.map((item, itemIndex) => (
                                      <Box key={itemIndex} sx={{ 
                                        bgcolor: '#e3f2fd', 
                                        p: 1, 
                                        mb: 1, 
                                        borderRadius: 1,
                                        border: '1px solid #bbdefb'
                                      }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                          {item.description || 'No description'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Owner: {item.owner || 'Not assigned'}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Grid>
                                )}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        );
                      });
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ height: 'fit-content' }}>
                  <CardHeader 
                    title="🎯 Key Achievements"
                    avatar={<Avatar sx={{ bgcolor: 'success.main' }}><CheckCircleIcon /></Avatar>}
                  />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Enhanced Questionnaire Implementation"
                          secondary="Streamlined assessment with action items"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Risk Assessment Improvement"
                          secondary="4-level classification system implemented"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><AssignmentIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Action Item Tracking"
                          secondary="Owner-assigned action items for each isolation"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><AccessTimeIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Meeting Efficiency"
                          secondary="Structured review process optimized"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Risk Analysis */}
          {tabValue === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardHeader 
                    title="⚠️ Risk Distribution Analysis"
                    avatar={<Avatar sx={{ bgcolor: 'error.main' }}><ErrorIcon /></Avatar>}
                  />
                  <CardContent>
                    {Object.entries(meetingData.riskAnalysis.distribution).map(([risk, data]) => (
                      <Box key={risk} sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body1" fontWeight="medium">{risk} Risk</Typography>
                          <Chip 
                            label={`${data.count} (${data.percentage}%)`}
                            color={
                              risk === 'Critical' ? 'error' :
                              risk === 'High' ? 'warning' :
                              risk === 'Medium' ? 'info' : 'success'
                            }
                            size="small"
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={data.percentage} 
                          color={
                            risk === 'Critical' ? 'error' :
                            risk === 'High' ? 'warning' :
                            risk === 'Medium' ? 'info' : 'success'
                          }
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4, mb: 4 }}>
        <Button 
          variant="contained" 
          color="success" 
          size="large"
          startIcon={<SaveIcon />}
          onClick={confirmFinalizeMeeting}
          sx={{ px: 6, py: 2, borderRadius: 3 }}
        >
          Finalize Meeting
        </Button>
      </Box>
      
      {/* Dialogs */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckCircleIcon color="success" sx={{ mr: 2 }} />
            Finalize Meeting?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will save the meeting summary with all detailed analytics and recommendations. 
            The data will be available in the Past Meetings section for future reference and reporting.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={finalizeMeeting} variant="contained" color="success">
            Save Meeting
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default ComprehensiveMeetingSummary;
