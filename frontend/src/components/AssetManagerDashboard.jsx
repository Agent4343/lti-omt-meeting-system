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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

const AssetManagerDashboard = () => {
  const { meetings } = useAppContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLTI, setSelectedLTI] = useState(null);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('age');

  // Calculate LTI age in days from planned start date
  const calculateLTIAge = (plannedStartDate) => {
    if (!plannedStartDate) return { days: 0, display: 'Unknown', category: 'unknown' };
    
    try {
      const startDate = new Date(plannedStartDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let display = '';
      let category = '';
      
      if (diffDays < 30) {
        display = `${diffDays} days`;
        category = 'recent';
      } else if (diffDays < 183) { // Less than 6 months
        const months = Math.floor(diffDays / 30);
        display = `${months} month${months > 1 ? 's' : ''}`;
        category = 'medium';
      } else if (diffDays < 365) { // 6-12 months
        const months = Math.floor(diffDays / 30);
        display = `${months} month${months > 1 ? 's' : ''}`;
        category = 'sixplus';
      } else if (diffDays < 730) { // 1-2 years
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        display = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
        category = 'oneyearplus';
      } else { // 2+ years
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        display = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
        category = 'twoyearplus';
      }
      
      return { days: diffDays, display, category };
    } catch (error) {
      return { days: 0, display: 'Invalid Date', category: 'unknown' };
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
            meetingName: meeting.name || 'Unnamed Meeting',
            
            // Risk Assessment
            riskLevel: response.riskLevel || 'N/A',
            businessImpact: response.businessImpact || 'N/A',
            
            // MOC Information
            mocRequired: response.mocRequired || 'N/A',
            mocNumber: response.mocNumber || '',
            mocStatus: response.mocStatus || 'N/A',
            
            // Parts Information
            partsRequired: response.partsRequired || 'N/A',
            partsExpectedDate: response.partsExpectedDate || '',
            partsStatus: response.partsStatus || 'Not Assessed',
            
            // Equipment Information
            equipmentDisconnectionRequired: response.equipmentDisconnectionRequired || 'N/A',
            equipmentRemovalRequired: response.equipmentRemovalRequired || 'N/A',
            
            // Timeline
            plannedResolutionDate: response.plannedResolutionDate || '',
            workWindowRequired: response.workWindowRequired || 'N/A',
            priorityLevel: response.priorityLevel || 'N/A',
            
            // Actions
            actionRequired: response.actionRequired || 'N/A',
            actionItems: response.actionItems || [],
            
            // WMS Manual Risks
            corrosionRisk: response.corrosionRisk || 'N/A',
            deadLegsRisk: response.deadLegsRisk || 'N/A',
            automationLossRisk: response.automationLossRisk || 'N/A',
            
            // Comments
            comments: response.comments || '',
            
            // Full response for detailed view
            fullResponse: response
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
    const sixMonthsPlus = processedLTIData.filter(lti => 
      lti.ageInfo.category === 'sixplus' || 
      lti.ageInfo.category === 'oneyearplus' || 
      lti.ageInfo.category === 'twoyearplus'
    );
    
    const criticalRisk = processedLTIData.filter(lti => lti.riskLevel === 'Critical');
    const highRisk = processedLTIData.filter(lti => lti.riskLevel === 'High');
    const mediumRisk = processedLTIData.filter(lti => lti.riskLevel === 'Medium');
    const lowRisk = processedLTIData.filter(lti => lti.riskLevel === 'Low');
    
    const mocRequired = processedLTIData.filter(lti => lti.mocRequired === 'Yes');
    const mocInProgress = processedLTIData.filter(lti => 
      lti.mocRequired === 'Yes' && 
      (lti.mocStatus === 'Submitted' || lti.mocStatus === 'Approved' || lti.mocStatus === 'In Progress')
    );
    const mocCompleted = processedLTIData.filter(lti => 
      lti.mocRequired === 'Yes' && lti.mocStatus === 'Completed'
    );
    
    const equipmentDisconnection = processedLTIData.filter(lti => 
      lti.equipmentDisconnectionRequired === 'Yes' || lti.equipmentDisconnectionRequired === 'Partially'
    );
    const equipmentRemoval = processedLTIData.filter(lti => 
      lti.equipmentRemovalRequired === 'Yes' || lti.equipmentRemovalRequired === 'Temporarily'
    );
    
    const urgentAction = processedLTIData.filter(lti => lti.actionRequired === 'Urgent');
    const planWorkAction = processedLTIData.filter(lti => lti.actionRequired === 'Plan Work');
    
    const ageDistribution = {
      sixToTwelveMonths: processedLTIData.filter(lti => lti.ageInfo.category === 'sixplus').length,
      oneToTwoYears: processedLTIData.filter(lti => lti.ageInfo.category === 'oneyearplus').length,
      twoYearsPlus: processedLTIData.filter(lti => lti.ageInfo.category === 'twoyearplus').length
    };
    
    return {
      totalLTIs,
      sixMonthsPlus: sixMonthsPlus.length,
      criticalRisk: criticalRisk.length,
      highRisk: highRisk.length,
      mediumRisk: mediumRisk.length,
      lowRisk: lowRisk.length,
      mocRequired: mocRequired.length,
      mocInProgress: mocInProgress.length,
      mocCompleted: mocCompleted.length,
      equipmentDisconnection: equipmentDisconnection.length,
      equipmentRemoval: equipmentRemoval.length,
      urgentAction: urgentAction.length,
      planWorkAction: planWorkAction.length,
      ageDistribution,
      sixMonthsPlusLTIs: sixMonthsPlus,
      criticalLTIs: criticalRisk,
      urgentLTIs: urgentAction
    };
  }, [processedLTIData]);

  // Filter and sort LTIs
  const filteredLTIs = useMemo(() => {
    let filtered = processedLTIData;
    
    switch (selectedFilter) {
      case 'sixplus':
        filtered = dashboardStats.sixMonthsPlusLTIs;
        break;
      case 'critical':
        filtered = dashboardStats.criticalLTIs;
        break;
      case 'mocRequired':
        filtered = processedLTIData.filter(lti => lti.mocRequired === 'Yes');
        break;
      case 'equipmentIssues':
        filtered = processedLTIData.filter(lti => 
          lti.equipmentDisconnectionRequired === 'Yes' || 
          lti.equipmentRemovalRequired === 'Yes'
        );
        break;
      case 'urgent':
        filtered = dashboardStats.urgentLTIs;
        break;
      default:
        filtered = processedLTIData;
    }
    
    // Sort the filtered results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'age':
          return b.ageInfo.days - a.ageInfo.days;
        case 'risk':
          const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'N/A': 0 };
          return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
        case 'id':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });
  }, [processedLTIData, selectedFilter, sortBy, dashboardStats]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getAgeColor = (category) => {
    switch (category) {
      case 'twoyearplus': return 'error';
      case 'oneyearplus': return 'warning';
      case 'sixplus': return 'info';
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

  const exportToPDF = () => {
    // This would integrate with the existing PDF export system
    console.log('Exporting Asset Manager Report to PDF...');
    alert('PDF export functionality will be integrated with the existing PDF system');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
          Asset Manager Dashboard
          <Chip 
            label="6-Month LTI Review System" 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 2 }}
          />
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>WMS Manual Compliance:</strong> LTIs over 6 months require regular Asset Manager review and escalation. 
          This dashboard tracks all LTIs requiring management attention and generates meeting agendas for quarterly reviews.
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
              <Typography variant="body2" color="text.secondary">
                6+ Months Old
                <Chip label="REQUIRES REVIEW" size="small" color="warning" sx={{ ml: 1, fontSize: '0.7rem' }} />
              </Typography>
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

      {/* Status Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 1, color: 'warning.main' }} />
                Age Distribution (6+ Months)
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Chip label="6-12M" size="small" color="info" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.ageDistribution.sixToTwelveMonths} LTIs`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="1-2Y" size="small" color="warning" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.ageDistribution.oneToTwoYears} LTIs`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="2Y+" size="small" color="error" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.ageDistribution.twoYearsPlus} LTIs`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'error.main' }} />
                Risk Analysis
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Chip label="Critical" size="small" color="error" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.criticalRisk} LTIs`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="High" size="small" color="warning" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.highRisk} LTIs`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="Medium" size="small" color="info" /></ListItemIcon>
                  <ListItemText primary={`${dashboardStats.mediumRisk} LTIs`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                MOC & Equipment Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary={`MOCs In Progress: ${dashboardStats.mocInProgress}`}
                    secondary={`Required: ${dashboardStats.mocRequired}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BuildIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary={`Equipment Issues: ${dashboardStats.equipmentDisconnection}`}
                    secondary={`Disconnection/Removal required`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter LTIs</InputLabel>
              <Select
                value={selectedFilter}
                label="Filter LTIs"
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <MenuItem value="all">All LTIs</MenuItem>
                <MenuItem value="sixplus">6+ Months Old</MenuItem>
                <MenuItem value="critical">Critical Risk</MenuItem>
                <MenuItem value="mocRequired">MOC Required</MenuItem>
                <MenuItem value="equipmentIssues">Equipment Issues</MenuItem>
                <MenuItem value="urgent">Urgent Action</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="age">Age (Oldest First)</MenuItem>
                <MenuItem value="risk">Risk Level</MenuItem>
                <MenuItem value="id">LTI ID</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={generateMeetingAgenda}
              color="primary"
            >
              Generate Meeting Agenda
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToPDF}
              color="secondary"
            >
              Export Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* LTI Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            LTI Details ({filteredLTIs.length} of {processedLTIData.length})
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>LTI ID</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Age</strong></TableCell>
                  <TableCell><strong>Risk</strong></TableCell>
                  <TableCell><strong>MOC Status</strong></TableCell>
                  <TableCell><strong>Equipment</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLTIs.map((lti, index) => (
                  <TableRow key={`${lti.id}-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {lti.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {lti.description.length > 40 
                          ? `${lti.description.substring(0, 40)}...` 
                          : lti.description
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lti.ageInfo.display} 
                        size="small" 
                        color={getAgeColor(lti.ageInfo.category)}
                        variant={lti.ageInfo.category.includes('plus') ? 'filled' : 'outlined'}
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
                      <Box>
                        <Typography variant="body2">
                          MOC: {lti.mocRequired}
                        </Typography>
                        {lti.mocRequired === 'Yes' && (
                          <Typography variant="caption" color="text.secondary">
                            Status: {lti.mocStatus}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {lti.equipmentDisconnectionRequired === 'Yes' && (
                          <Chip label="Disconnect" size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                        )}
                        {lti.equipmentRemovalRequired === 'Yes' && (
                          <Chip label="Remove" size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lti.actionRequired} 
                        size="small" 
                        color={lti.actionRequired === 'Urgent' ? 'error' : lti.actionRequired === 'Plan Work' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
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
          
          {filteredLTIs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No LTIs match the selected filter criteria.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* LTI Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          LTI Details: {selectedLTI?.id}
          <Chip 
            label={selectedLTI?.ageInfo.display} 
            color={getAgeColor(selectedLTI?.ageInfo.category)}
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedLTI && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Description:</strong> {selectedLTI.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
                    <Typography variant="body2">Risk Level: <Chip label={selectedLTI.riskLevel} size="small" color={getRiskColor(selectedLTI.riskLevel)} /></Typography>
                    <Typography variant="body2">Business Impact: {selectedLTI.businessImpact}</Typography>
                    <Typography variant="body2">Corrosion Risk: {selectedLTI.corrosionRisk}</Typography>
                    <Typography variant="body2">Dead Legs Risk: {selectedLTI.deadLegsRisk}</Typography>
                    <Typography variant="body2">Automation Loss Risk: {selectedLTI.automationLossRisk}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>MOC & Timeline</Typography>
                    <Typography variant="body2">MOC Required: {selectedLTI.mocRequired}</Typography>
                    {selectedLTI.mocRequired === 'Yes' && (
                      <>
                        <Typography variant="body2">MOC Number: {selectedLTI.mocNumber || 'Not assigned'}</Typography>
                        <Typography variant="body2">MOC Status: {selectedLTI.mocStatus}</Typography>
                      </>
                    )}
                    <Typography variant="body2">Planned Resolution: {selectedLTI.plannedResolutionDate || 'Not set'}</Typography>
                    <Typography variant="body2">Work Window: {selectedLTI.workWindowRequired}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Equipment & Parts Status</Typography>
                    <Typography variant="body2">Equipment Disconnection Required: {selectedLTI.equipmentDisconnectionRequired}</Typography>
                    <Typography variant="body2">Equipment Removal Required: {selectedLTI.equipmentRemovalRequired}</Typography>
                    <Typography variant="body2">Parts Required: {selectedLTI.partsRequired}</Typography>
                    {selectedLTI.partsRequired === 'Yes' && (
                      <>
                        <Typography variant="body2">Parts Status: {selectedLTI.partsStatus}</Typography>
                        <Typography variant="body2">Expected Arrival: {selectedLTI.partsExpectedDate || 'Not specified'}</Typography>
                      </>
                    )}
                  </Paper>
                </Grid>
                
                {selectedLTI.comments && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Comments</Typography>
                      <Typography variant="body2">{selectedLTI.comments}</Typography>
                    </Paper>
                  </Grid>
                )}
                
                {selectedLTI.actionItems && selectedLTI.actionItems.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Action Items</Typography>
                      {selectedLTI.actionItems.map((item, index) => (
                        <Typography key={index} variant="body2">
                          • {item.description} {item.owner && `(Owner: ${item.owner})`}
                        </Typography>
                      ))}
                    </Paper>
                  </Grid>
                )}
              </Grid>
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
          <Chip label={`${dashboardStats.sixMonthsPlus} LTIs Require Review`} color="warning" sx={{ ml: 2 }} />
        </DialogTitle>
        <DialogContent>
          <MeetingAgendaContent stats={dashboardStats} ltis={filteredLTIs} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendaDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportToPDF}>
            Export Agenda
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Meeting Agenda Content Component
const MeetingAgendaContent = ({ stats, ltis }) => {
  const currentDate = new Date().toLocaleDateString();
  
  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Asset Manager Review Meeting
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Date:</strong> {currentDate}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Duration:</strong> 90 minutes
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Attendees:</strong> Asset Manager, Operations Manager, Maintenance Manager, LTI Coordinators
        </Typography>
      </Paper>
      
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">1. Executive Summary (10 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary={`Total LTIs: ${stats.totalLTIs}`}
                secondary="Current total number of Long Term Isolations being tracked"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`LTIs Over 6 Months: ${stats.sixMonthsPlus}`}
                secondary="Requiring Asset Manager review per WMS Manual requirements"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`Critical Risk LTIs: ${stats.criticalRisk}`}
                secondary="Requiring immediate management attention"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`MOCs Required: ${stats.mocRequired}`}
                secondary={`In Progress: ${stats.mocInProgress}, Completed: ${stats.mocCompleted}`}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">2. Critical LTIs Requiring Immediate Attention (30 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {stats.sixMonthsPlusLTIs.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>LTI ID</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Key Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.sixMonthsPlusLTIs.slice(0, 10).map((lti) => (
                    <TableRow key={lti.id}>
                      <TableCell>{lti.id}</TableCell>
                      <TableCell>{lti.ageInfo.display}</TableCell>
                      <TableCell>
                        <Chip label={lti.riskLevel} size="small" color={lti.riskLevel === 'Critical' ? 'error' : 'warning'} />
                      </TableCell>
                      <TableCell>
                        {lti.mocRequired === 'Yes' && 'MOC Required • '}
                        {lti.equipmentDisconnectionRequired === 'Yes' && 'Equipment Disconnect • '}
                        {lti.actionRequired === 'Urgent' && 'Urgent Action'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No LTIs over 6 months requiring review.</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">3. MOC Status Review (20 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary={`MOCs Required: ${stats.mocRequired}`}
                secondary="Total number of LTIs requiring Management of Change approval"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`MOCs In Progress: ${stats.mocInProgress}`}
                secondary="Currently being processed through MOC system"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`MOCs Completed: ${stats.mocCompleted}`}
                secondary="Successfully completed MOC process"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Discussion Points:"
                secondary="• Barriers to MOC completion • Resource allocation for MOC processing • Priority MOCs requiring expedited review"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">4. Equipment Management Issues (15 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary={`Equipment Disconnection Required: ${stats.equipmentDisconnection} LTIs`}
                secondary="Equipment requiring disconnection for resolution"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={`Equipment Removal Required: ${stats.equipmentRemoval} LTIs`}
                secondary="Equipment requiring temporary or permanent removal"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Key Discussion Points:"
                secondary="• Resource requirements for equipment work • Safety considerations • Work window coordination • Contractor requirements"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">5. Risk Trends and Analysis (10 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary="Age Distribution Analysis"
                secondary={`6-12 months: ${stats.ageDistribution.sixToTwelveMonths} | 1-2 years: ${stats.ageDistribution.oneToTwoYears} | 2+ years: ${stats.ageDistribution.twoYearsPlus}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Risk Level Distribution"
                secondary={`Critical: ${stats.criticalRisk} | High: ${stats.highRisk} | Medium: ${stats.mediumRisk} | Low: ${stats.lowRisk}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Trending Concerns"
                secondary="• LTIs approaching 2-year threshold • Increasing number requiring MOCs • Equipment issues concentration"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">6. Action Items and Next Steps (5 min)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary="Immediate Actions Required"
                secondary={`${stats.urgentAction} LTIs require urgent action`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Work Planning Required"
                secondary={`${stats.planWorkAction} LTIs require work planning`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Next Review Schedule"
                secondary="Schedule next Asset Manager review meeting in 6 months"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Follow-up Actions"
                secondary="• Assign owners for critical LTIs • Set MOC completion targets • Schedule equipment work windows"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AssetManagerDashboard;