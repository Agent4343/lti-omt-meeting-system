import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Business as BusinessIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

const AssetManagerDashboard = () => {
  const { meetings } = useAppContext();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLTI, setSelectedLTI] = useState(null);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);

  // Calculate LTI age in days from planned start date
  const calculateLTIAge = (plannedStartDate) => {
    if (!plannedStartDate) return { days: 0, display: 'Unknown', isSixMonthsPlus: false };
    
    try {
      const startDate = new Date(plannedStartDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isSixMonthsPlus = diffDays >= 183; // 6 months = ~183 days
      
      let display = '';
      if (diffDays < 30) {
        display = `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        display = `${months} months`;
      } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        display = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} months` : ''}`;
      }
      
      return { days: diffDays, display, isSixMonthsPlus };
    } catch (error) {
      return { days: 0, display: 'Invalid Date', isSixMonthsPlus: false };
    }
  };

  // Process all LTI data from meetings
  const processedLTIData = useMemo(() => {
    const allLTIs = [];
    
    meetings.forEach(meeting => {
      if (meeting.isolations && meeting.responses) {
        meeting.isolations.forEach(isolation => {
          const response = meeting.responses[isolation.id] || {};
          const ageInfo = calculateLTIAge(isolation['Planned Start Date'] || isolation.plannedStartDate);
          
          const ltiData = {
            id: isolation.id,
            description: isolation.description || isolation.Title || 'No description',
            plannedStartDate: isolation['Planned Start Date'] || isolation.plannedStartDate,
            ageInfo: ageInfo,
            meetingDate: meeting.date,
            
            // Assessment data
            riskLevel: response.riskLevel || 'N/A',
            businessImpact: response.businessImpact || 'N/A',
            mocRequired: response.mocRequired || 'N/A',
            mocNumber: response.mocNumber || '',
            mocStatus: response.mocStatus || 'N/A',
            partsRequired: response.partsRequired || 'N/A',
            partsExpectedDate: response.partsExpectedDate || '',
            partsStatus: response.partsStatus || 'Not Assessed',
            equipmentDisconnectionRequired: response.equipmentDisconnectionRequired || 'N/A',
            equipmentRemovalRequired: response.equipmentRemovalRequired || 'N/A',
            plannedResolutionDate: response.plannedResolutionDate || '',
            actionRequired: response.actionRequired || 'N/A',
            actionItems: response.actionItems || [],
            comments: response.comments || '',
            
            // WMS Manual risks
            corrosionRisk: response.corrosionRisk || 'N/A',
            deadLegsRisk: response.deadLegsRisk || 'N/A',
            automationLossRisk: response.automationLossRisk || 'N/A'
          };
          
          allLTIs.push(ltiData);
        });
      }
    });
    
    return allLTIs;
  }, [meetings]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalLTIs = processedLTIData.length;
    const sixMonthsPlus = processedLTIData.filter(lti => lti.ageInfo.isSixMonthsPlus);
    const criticalRisk = processedLTIData.filter(lti => lti.riskLevel === 'Critical');
    const highRisk = processedLTIData.filter(lti => lti.riskLevel === 'High');
    const mocRequired = processedLTIData.filter(lti => lti.mocRequired === 'Yes');
    const mocInProgress = processedLTIData.filter(lti => 
      lti.mocRequired === 'Yes' && 
      (lti.mocStatus === 'Submitted' || lti.mocStatus === 'Approved' || lti.mocStatus === 'In Progress')
    );
    const equipmentIssues = processedLTIData.filter(lti => 
      lti.equipmentDisconnectionRequired === 'Yes' || lti.equipmentRemovalRequired === 'Yes'
    );
    const urgentAction = processedLTIData.filter(lti => lti.actionRequired === 'Urgent');
    
    return {
      totalLTIs,
      sixMonthsPlus: sixMonthsPlus.length,
      criticalRisk: criticalRisk.length,
      highRisk: highRisk.length,
      mocRequired: mocRequired.length,
      mocInProgress: mocInProgress.length,
      equipmentIssues: equipmentIssues.length,
      urgentAction: urgentAction.length,
      sixMonthsPlusLTIs: sixMonthsPlus,
      criticalLTIs: criticalRisk,
      urgentLTIs: urgentAction
    };
  }, [processedLTIData]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const handleViewDetails = (lti) => {
    setSelectedLTI(lti);
    setDetailDialogOpen(true);
  };

  const generateMeetingAgenda = () => {
    setAgendaDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
          Asset Manager Dashboard
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>WMS Manual Requirement:</strong> LTIs over 6 months require Asset Manager review every 6 months. 
          This dashboard tracks {dashboardStats.sixMonthsPlus} LTIs requiring management attention.
        </Alert>
      </Box>

      {/* Key Metrics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" color="primary.main">{dashboardStats.totalLTIs}</Typography>
              <Typography variant="body2" color="text.secondary">Total LTIs</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3" color="warning.main">{dashboardStats.sixMonthsPlus}</Typography>
              <Typography variant="body2" color="text.secondary">6+ Months Old</Typography>
              <Chip label="REQUIRES REVIEW" size="small" color="warning" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h3" color="error.main">{dashboardStats.criticalRisk}</Typography>
              <Typography variant="body2" color="text.secondary">Critical Risk</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e8' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" color="success.main">{dashboardStats.mocRequired}</Typography>
              <Typography variant="body2" color="text.secondary">MOCs Required</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<CalendarIcon />}
          onClick={generateMeetingAgenda}
          color="primary"
          size="large"
        >
          Generate Meeting Agenda
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          color="secondary"
          size="large"
        >
          Export Asset Manager Report
        </Button>
      </Box>

      {/* 6+ Month LTIs Requiring Review */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            LTIs Over 6 Months - Requiring Asset Manager Review ({dashboardStats.sixMonthsPlus})
          </Typography>
          
          {dashboardStats.sixMonthsPlus > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>LTI ID</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Risk</strong></TableCell>
                    <TableCell><strong>MOC Status</strong></TableCell>
                    <TableCell><strong>Parts Status</strong></TableCell>
                    <TableCell><strong>Equipment Issues</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardStats.sixMonthsPlusLTIs.map((lti) => (
                    <TableRow key={lti.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {lti.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={lti.ageInfo.display} 
                          size="small" 
                          color={lti.ageInfo.days > 730 ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={lti.riskLevel} 
                          size="small" 
                          color={getRiskColor(lti.riskLevel)}
                        />
                      </TableCell>
                      <TableCell>
                        {lti.mocRequired === 'Yes' ? (
                          <Box>
                            <Typography variant="body2">Required</Typography>
                            <Typography variant="caption">{lti.mocStatus}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2">{lti.mocRequired}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {lti.partsRequired === 'Yes' ? (
                          <Box>
                            <Typography variant="body2">{lti.partsStatus}</Typography>
                            {lti.partsExpectedDate && (
                              <Typography variant="caption" color="text.secondary">
                                Expected: {new Date(lti.partsExpectedDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2">{lti.partsRequired}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {lti.equipmentDisconnectionRequired === 'Yes' && (
                          <Chip label="Disconnect" size="small" color="warning" sx={{ mr: 0.5 }} />
                        )}
                        {lti.equipmentRemovalRequired === 'Yes' && (
                          <Chip label="Remove" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Full Details">
                          <IconButton size="small" onClick={() => handleViewDetails(lti)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">
              <strong>Good News:</strong> No LTIs are currently over 6 months old requiring Asset Manager review.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* MOC Progress Tracking */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                MOC Progress Tracking
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary={`MOCs Required: ${dashboardStats.mocRequired}`}
                    secondary="Total LTIs requiring Management of Change"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`MOCs In Progress: ${dashboardStats.mocInProgress}`}
                    secondary="Currently being processed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="MOC Progress Rate"
                    secondary={`${dashboardStats.mocRequired > 0 ? Math.round((dashboardStats.mocInProgress / dashboardStats.mocRequired) * 100) : 0}% completion rate`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BuildIcon sx={{ mr: 1, color: 'warning.main' }} />
                Equipment Management Issues
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary={`Equipment Issues: ${dashboardStats.equipmentIssues}`}
                    secondary="LTIs requiring equipment disconnection or removal"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Urgent Actions: ${dashboardStats.urgentAction}`}
                    secondary="LTIs requiring immediate action"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Risk Distribution"
                    secondary={`Critical: ${dashboardStats.criticalRisk} | High: ${dashboardStats.highRisk} LTIs`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* LTI Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          LTI Details: {selectedLTI?.id}
        </DialogTitle>
        <DialogContent>
          {selectedLTI && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Typography variant="body2">Description: {selectedLTI.description}</Typography>
              <Typography variant="body2">Age: {selectedLTI.ageInfo.display}</Typography>
              <Typography variant="body2">Risk Level: {selectedLTI.riskLevel}</Typography>
              <Typography variant="body2">Business Impact: {selectedLTI.businessImpact}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>MOC Information</Typography>
              <Typography variant="body2">MOC Required: {selectedLTI.mocRequired}</Typography>
              {selectedLTI.mocRequired === 'Yes' && (
                <>
                  <Typography variant="body2">MOC Number: {selectedLTI.mocNumber || 'Not assigned'}</Typography>
                  <Typography variant="body2">MOC Status: {selectedLTI.mocStatus}</Typography>
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Parts & Equipment</Typography>
              <Typography variant="body2">Parts Required: {selectedLTI.partsRequired}</Typography>
              {selectedLTI.partsRequired === 'Yes' && (
                <>
                  <Typography variant="body2">Parts Status: {selectedLTI.partsStatus}</Typography>
                  <Typography variant="body2">Expected Arrival: {selectedLTI.partsExpectedDate || 'Not specified'}</Typography>
                </>
              )}
              <Typography variant="body2">Equipment Disconnection: {selectedLTI.equipmentDisconnectionRequired}</Typography>
              <Typography variant="body2">Equipment Removal: {selectedLTI.equipmentRemovalRequired}</Typography>
              
              {selectedLTI.comments && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Comments</Typography>
                  <Typography variant="body2">{selectedLTI.comments}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Agenda Dialog */}
      <Dialog 
        open={agendaDialogOpen} 
        onClose={() => setAgendaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Asset Manager Review Meeting Agenda
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Asset Manager Review Meeting
            </Typography>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              <strong>Duration:</strong> 90 minutes
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Purpose:</strong> 6-Month LTI Review (WMS Manual Compliance)
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Meeting Agenda</Typography>
            
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              1. Executive Summary (10 min)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={`Total LTIs: ${dashboardStats.totalLTIs}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`LTIs Over 6 Months: ${dashboardStats.sixMonthsPlus} (Require Review)`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Critical Risk: ${dashboardStats.criticalRisk} | High Risk: ${dashboardStats.highRisk}`} />
              </ListItem>
            </List>
            
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              2. Critical LTIs Review (30 min)
            </Typography>
            {dashboardStats.sixMonthsPlusLTIs.length > 0 ? (
              <List dense>
                {dashboardStats.sixMonthsPlusLTIs.slice(0, 5).map((lti) => (
                  <ListItem key={lti.id}>
                    <ListItemText 
                      primary={`${lti.id}: ${lti.ageInfo.display} old, ${lti.riskLevel} risk`}
                      secondary={`MOC: ${lti.mocRequired} | Equipment Issues: ${lti.equipmentDisconnectionRequired === 'Yes' ? 'Disconnect' : ''} ${lti.equipmentRemovalRequired === 'Yes' ? 'Remove' : ''}`}
                    />
                  </ListItem>
                ))}
                {dashboardStats.sixMonthsPlusLTIs.length > 5 && (
                  <ListItem>
                    <ListItemText primary={`... and ${dashboardStats.sixMonthsPlusLTIs.length - 5} more LTIs`} />
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography variant="body2">No LTIs over 6 months requiring review.</Typography>
            )}
            
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              3. MOC Status Review (20 min)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={`MOCs Required: ${dashboardStats.mocRequired}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`MOCs In Progress: ${dashboardStats.mocInProgress}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Discussion: Barriers to completion, resource allocation" />
              </ListItem>
            </List>
            
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              4. Equipment Management (15 min)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={`Equipment Issues: ${dashboardStats.equipmentIssues} LTIs requiring disconnection/removal`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Discussion: Resource requirements, safety considerations, work windows" />
              </ListItem>
            </List>
            
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              5. Action Items (10 min)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={`Urgent Actions: ${dashboardStats.urgentAction} LTIs`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Assign owners and timelines for critical LTIs" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Schedule next Asset Manager review (6 months)" />
              </ListItem>
            </List>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendaDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Agenda PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetManagerDashboard;