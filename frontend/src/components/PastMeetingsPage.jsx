import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Container,
  Paper,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import { exportMeetingToPDF } from '../utils/pdfExport';

function PastMeetingsPage() {
  const navigate = useNavigate();
  const [pastMeetings, setPastMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: -1 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const savedMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
    setPastMeetings(savedMeetings);
    setFilteredMeetings(savedMeetings);
  }, []);

  useEffect(() => {
    // Apply filtering and sorting whenever pastMeetings, searchTerm, or sortOrder changes
    let filtered = [...pastMeetings];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting => 
        meeting.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.attendees.some(attendee => 
          attendee.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date);
      const dateB = new Date(b.timestamp || b.date);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
    
    setFilteredMeetings(filtered);
  }, [pastMeetings, searchTerm, sortOrder]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const confirmDeleteMeeting = (index) => {
    setDeleteDialog({ open: true, index });
  };

  const deleteMeeting = () => {
    const updatedMeetings = [...pastMeetings];
    updatedMeetings.splice(deleteDialog.index, 1);
    setPastMeetings(updatedMeetings);
    localStorage.setItem('pastMeetings', JSON.stringify(updatedMeetings));
    
    setDeleteDialog({ open: false, index: -1 });
    setSnackbar({
      open: true,
      message: 'Meeting deleted successfully',
      severity: 'success'
    });
  };

  const exportMeetingToExcel = (meeting, index) => {
    try {
      // Use new isolation data structure if available (version 4.0+)
      const isolations = meeting.isolations || [];
      const responses = meeting.responses || {};
      
      let rows = [];
      
      if (isolations.length > 0) {
        // New enhanced export with full isolation data
        rows = isolations.map(isolation => {
          const response = responses[isolation.id] || {};
          const plannedStartDate = isolation['Planned Start Date'] || isolation.plannedStartDate || isolation.PlannedStartDate;
          
          // Calculate LTI age
          const calculateLTIAge = (plannedStartDate) => {
            if (!plannedStartDate) return 'Unknown';
            try {
              const startDate = new Date(plannedStartDate);
              const currentDate = new Date();
              const diffTime = Math.abs(currentDate - startDate);
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
          
          return {
            'Isolation ID': isolation.id,
            'Description': isolation.description || isolation.Title || isolation.title || 'No description',
            'Risk Level': response.riskLevel || response.risk || 'N/A',
            'LTI Age': calculateLTIAge(plannedStartDate),
            'Planned Start Date': plannedStartDate ? new Date(plannedStartDate).toLocaleDateString() : 'N/A',
            'Duration': response.isolationDuration || 'N/A',
            'Business Impact': response.businessImpact || 'N/A',
            'MOC Required': response.mocRequired || 'N/A',
            'MOC Number': response.mocNumber || 'N/A',
            'Parts Required': response.partsRequired || 'N/A',
            'Parts Expected Date': response.partsExpectedDate ? new Date(response.partsExpectedDate).toLocaleDateString() : 'N/A',
            'Support Required': response.supportRequired || 'N/A',
            'Comments': response.comments || 'N/A',
            'Action Items': response.actionItems ? response.actionItems.map(item => `${item.description} (Owner: ${item.owner})`).join('; ') : 'N/A'
          };
        });
      } else if (meeting.responses && Object.keys(meeting.responses).length > 0) {
        // Fallback to old export format for legacy meetings
        rows = Object.entries(meeting.responses).map(([id, data]) => ({
          'Isolation ID': id,
          'Risk Level': data.riskLevel || data.risk || 'N/A',
          'Duration': data.isolationDuration || 'N/A',
          'Business Impact': data.businessImpact || 'N/A',
          'Parts Required': data.partsRequired || 'N/A',
          'MOC Required': data.mocRequired || 'N/A',
          'MOC Number': data.mocNumber || 'N/A',
          'Support Required': data.supportRequired || data.engineeringSupport || 'N/A',
          'Comments': data.comments || 'N/A'
        }));
      } else {
        setSnackbar({
          open: true,
          message: 'No data available to export',
          severity: 'warning'
        });
        return;
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'LTI OMT Meeting');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `LTI_OMT_Meeting_System_${meeting.date}.xlsx`);
      
      setSnackbar({
        open: true,
        message: 'Excel file downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Excel export error:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting to Excel. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleExportMeetingToPDF = async (meeting, index) => {
    try {
      const result = await exportMeetingToPDF(meeting);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error'
      });
    } catch (error) {
      console.error('PDF export error:', error);
      setSnackbar({
        open: true,
        message: 'Error generating PDF. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate statistics for a meeting
  const getMeetingStats = (meeting) => {
    if (!meeting) return null;
    
    // Use new meetingData structure if available (from ComprehensiveMeetingSummary)
    if (meeting.meetingData && meeting.meetingData.executiveSummary) {
      const execSummary = meeting.meetingData.executiveSummary;
      const riskDistribution = meeting.meetingData.riskAnalysis?.distribution || {};
      
      return {
        total: execSummary.totalIsolationsReviewed,
        criticalFindings: execSummary.criticalFindings,
        actionItems: execSummary.actionItemsGenerated,
        byRisk: {
          Critical: riskDistribution.Critical?.count || 0,
          High: riskDistribution.High?.count || 0,
          Medium: riskDistribution.Medium?.count || 0,
          Low: riskDistribution.Low?.count || 0
        },
        byParts: { Yes: 0, No: 0 },
        byMOC: { Yes: 0, No: 0 },
        byEngineering: { Yes: 0, No: 0 }
      };
    }
    
    // Fallback to old calculation method for legacy meetings
    if (!meeting.responses) return null;
    
    // If statistics are already calculated, use them
    if (meeting.statistics) return meeting.statistics;
    
    // Otherwise, calculate them using old structure
    const stats = {
      total: meeting.responses ? Object.keys(meeting.responses).length : 0,
      byRisk: { Critical: 0, High: 0, Medium: 0, Low: 0 },
      byParts: { Yes: 0, No: 0 },
      byMOC: { Yes: 0, No: 0 },
      byEngineering: { Yes: 0, No: 0 }
    };
    
    if (meeting.responses) {
      Object.values(meeting.responses).forEach(response => {
        // Count by risk (handle both old 'risk' and new 'riskLevel' fields)
        const riskLevel = response.riskLevel || response.risk;
        if (riskLevel) {
          const risk = riskLevel === 'N/A' ? 'Low' : riskLevel;
          stats.byRisk[risk] = (stats.byRisk[risk] || 0) + 1;
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
    }
    
    return stats;
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Past Meetings</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Search and Filter Controls */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by date or attendee"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="sort-order-label">Sort Order</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Sort Order"
                onChange={handleSortChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Meeting List */}
        {filteredMeetings.length === 0 ? (
          <Box textAlign="center" py={5}>
            {pastMeetings.length === 0 ? (
              <Typography variant="h6" color="text.secondary">No past meetings recorded yet.</Typography>
            ) : (
              <Typography variant="h6" color="text.secondary">No meetings match your search criteria.</Typography>
            )}
          </Box>
        ) : (
          <Box>
            {filteredMeetings.map((meeting, index) => {
              const stats = getMeetingStats(meeting);
              
              return (
                <Accordion 
                  key={index} 
                  sx={{ mb: 2 }}
                  expanded={expandedPanel === index}
                  onChange={handleAccordionChange(index)}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '&.Mui-expanded': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      }
                    }}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h6">
                          {meeting.date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(meeting.timestamp || meeting.date).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Attendees:</strong> {meeting.attendees.length}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Isolations:</strong> {stats ? stats.total : (meeting.responses ? Object.keys(meeting.responses).length : 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {stats && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.High || 0} High`} 
                              color="error" 
                              variant="outlined" 
                            />
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.Medium || 0} Medium`} 
                              color="warning" 
                              variant="outlined" 
                            />
                            <Chip 
                              size="small" 
                              label={`${stats.byRisk.Low || 0} Low`} 
                              color="success" 
                              variant="outlined" 
                            />
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 3, pb: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Summary" />
                        <Tab label="Isolations" />
                        {meeting.addedIsolations && meeting.addedIsolations.length > 0 && (
                          <Tab label="Changes" />
                        )}
                      </Tabs>
                    </Box>
                    
                    {/* Summary Tab */}
                    {tabValue === 0 && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Meeting Information</Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                <Typography variant="body1">{meeting.date}</Typography>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Attendees</Typography>
                                <Typography variant="body1">{meeting.attendees.join(', ')}</Typography>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Total Isolations Reviewed</Typography>
                                <Typography variant="body1">{stats ? stats.total : (meeting.responses ? Object.keys(meeting.responses).length : 0)}</Typography>
                              </Box>
                              
                              {meeting.meetingData?.executiveSummary?.relatedIsolationWarnings && 
                               meeting.meetingData.executiveSummary.relatedIsolationWarnings.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" color="text.secondary">Related Isolation Warnings</Typography>
                                  <Typography variant="body1" color="warning.main">
                                    {meeting.meetingData.executiveSummary.relatedIsolationWarnings.length} system relationship alerts detected
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                          
                          {/* Related Isolation Warnings Display */}
                          {meeting.meetingData?.executiveSummary?.relatedIsolationWarnings && 
                           meeting.meetingData.executiveSummary.relatedIsolationWarnings.length > 0 && (
                            <Card variant="outlined" sx={{ mt: 2 }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom color="warning.main">
                                  ⚠️ Related Isolation Warnings
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                  <Typography variant="body2">
                                    The following isolations shared system prefixes during this meeting, indicating potential related equipment and additional risks.
                                  </Typography>
                                </Alert>
                                {meeting.meetingData.executiveSummary.relatedIsolationWarnings.map((warning, wIndex) => (
                                  <Box key={wIndex} sx={{ 
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
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Statistics</Typography>
                              <Divider sx={{ mb: 2 }} />
                              
                              {stats && (
                                <Grid container spacing={3}>
                                  <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Risk Levels</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Chip 
                                        icon={<CheckCircleIcon />} 
                                        label={`Low: ${stats.byRisk.Low || 0}`} 
                                        color="success" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        icon={<WarningIcon />} 
                                        label={`Medium: ${stats.byRisk.Medium || 0}`} 
                                        color="warning" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        icon={<ErrorIcon />} 
                                        label={`High: ${stats.byRisk.High || 0}`} 
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
                                        label={`Yes: ${stats.byParts.Yes || 0}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        label={`No: ${stats.byParts.No || 0}`} 
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
                                        label={`Yes: ${stats.byEngineering.Yes || 0}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                      <Chip 
                                        label={`No: ${stats.byEngineering.No || 0}`} 
                                        color="default" 
                                        variant="outlined" 
                                        size="small"
                                      />
                                    </Box>
                                  </Grid>
                                </Grid>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                    
                    {/* Isolations Tab */}
                    {tabValue === 1 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Complete review of all isolations discussed in this meeting
                        </Typography>
                        
                        {(() => {
                          // Use new isolation data structure if available (version 4.0+)
                          const isolations = meeting.isolations || [];
                          const responses = meeting.responses || {};
                          
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
                          
                          if (isolations.length > 0) {
                            // New enhanced display with full isolation data
                            return isolations.map((isolation, index) => {
                              const response = responses[isolation.id] || {};
                              const riskLevel = response.riskLevel || response.risk || 'N/A';
                              const comments = response.comments || '';
                              const actionItems = response.actionItems || [];
                              
                              // Check for related isolations
                              const relatedIsolations = checkForRelatedIsolations(isolations, isolation);
                              
                              // Calculate LTI age
                              const calculateLTIAge = (plannedStartDate) => {
                                if (!plannedStartDate) return 'Unknown';
                                try {
                                  const startDate = new Date(plannedStartDate);
                                  const currentDate = new Date();
                                  const diffTime = Math.abs(currentDate - startDate);
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
                              
                              const ltiAge = calculateLTIAge(isolation['Planned Start Date'] || isolation.plannedStartDate || isolation.PlannedStartDate);
                              const plannedStartDate = isolation['Planned Start Date'] || isolation.plannedStartDate || isolation.PlannedStartDate;
                              
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
                                        {/* LTI Age Display */}
                                        {ltiAge !== 'Unknown' && (
                                          <Chip 
                                            label={`Age: ${ltiAge}`}
                                            color={ltiAge.includes('year') ? 'error' : ltiAge.includes('month') ? 'warning' : 'info'}
                                            size="small"
                                            variant="outlined"
                                          />
                                        )}
                                        {/* Related Isolation Warning */}
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
                                        {/* Risk Level */}
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
                                              This isolation shares the same system prefix with {relatedIsolations.length} other isolation(s), indicating potential related equipment and additional risks.
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
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Risk Level:</strong> {riskLevel}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Duration:</strong> {response.isolationDuration || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Business Impact:</strong> {response.businessImpact || 'N/A'}
                                        </Typography>
                                        {/* LTI Age Display */}
                                        {ltiAge !== 'Unknown' && (
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>LTI Age:</strong> {ltiAge}
                                          </Typography>
                                        )}
                                        {/* Planned Start Date */}
                                        {plannedStartDate && (
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Started:</strong> {new Date(plannedStartDate).toLocaleDateString()}
                                          </Typography>
                                        )}
                                      </Grid>
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>MOC Required:</strong> {response.mocRequired || 'N/A'}
                                        </Typography>
                                        {response.mocRequired === 'Yes' && response.mocNumber && (
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>MOC Number:</strong> {response.mocNumber}
                                          </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Parts Required:</strong> {response.partsRequired || 'N/A'}
                                        </Typography>
                                        {response.partsRequired === 'Yes' && response.partsExpectedDate && (
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Parts Expected:</strong> {new Date(response.partsExpectedDate).toLocaleDateString()}
                                          </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Support Required:</strong> {response.supportRequired || 'N/A'}
                                        </Typography>
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
                          } else if (meeting.responses && Object.keys(meeting.responses).length > 0) {
                            // Fallback to old display format for legacy meetings
                            return Object.entries(meeting.responses).map(([id, response]) => {
                              const riskLevel = response.riskLevel || response.risk || 'N/A';
                              const comments = response.comments || '';
                              const actionItems = response.actionItems || [];
                              
                              // Function to check for related isolations based on first 3 digits after CAHE-
                              const checkForRelatedIsolations = (responses, currentId) => {
                                const related = Object.keys(responses).filter(isolationId => {
                                  if (isolationId === currentId) return false;
                                  
                                  // Extract first 3 digits after CAHE- for both isolations
                                  const currentMatch = currentId.match(/CAHE-(\d{3})/);
                                  const isolationMatch = isolationId.match(/CAHE-(\d{3})/);
                                  
                                  if (currentMatch && isolationMatch) {
                                    return currentMatch[1] === isolationMatch[1];
                                  }
                                  return false;
                                });
                                return related;
                              };
                              
                              const relatedIsolations = checkForRelatedIsolations(meeting.responses, id);
                              
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
                                <Accordion key={id} sx={{ mb: 1 }}>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                      <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                                        {id} - {response.description || 'No description'}
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
                                              {relatedIsolations.map(relatedId => (
                                                <Chip
                                                  key={relatedId}
                                                  label={relatedId}
                                                  size="small"
                                                  variant="outlined"
                                                  color="warning"
                                                />
                                              ))}
                                            </Box>
                                          </Alert>
                                        </Grid>
                                      )}
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Risk Level:</strong> {riskLevel}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Duration:</strong> {response.isolationDuration || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Business Impact:</strong> {response.businessImpact || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>MOC Required:</strong> {response.mocRequired || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Parts Required:</strong> {response.partsRequired || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          <strong>Support Required:</strong> {response.supportRequired || 'N/A'}
                                        </Typography>
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
                          } else {
                            // No data available
                            return (
                              <Alert severity="info" sx={{ mt: 2 }}>
                                No isolation responses found for this meeting.
                              </Alert>
                            );
                          }
                        })()}
                      </Box>
                    )}
                    
                    {/* Changes Tab */}
                    {tabValue === 2 && meeting.addedIsolations && meeting.addedIsolations.length > 0 && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" gutterBottom color="success.main">New Isolations Added</Typography>
                          <List sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', borderRadius: 1 }}>
                            {meeting.addedIsolations.map((item, idx) => (
                              <ListItem key={idx} divider>
                                <ListItemText 
                                  primary={`${item.Title || item.id}`} 
                                  secondary={
                                    <Box>
                                      {Object.entries(item)
                                        .filter(([key]) => key !== 'id' && key !== 'Title')
                                        .map(([key, value]) => (
                                          <Typography key={key} variant="body2" component="span" sx={{ mr: 2 }}>
                                            <strong>{key}:</strong> {value}
                                          </Typography>
                                        ))
                                      }
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        
                        {meeting.removedIsolations && meeting.removedIsolations.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom color="error.main">Isolations Removed</Typography>
                            <List sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1 }}>
                              {meeting.removedIsolations.map((item, idx) => (
                                <ListItem key={idx} divider>
                                  <ListItemText 
                                    primary={`${item.Title || item.id}`} 
                                    secondary={
                                      <Box>
                                        {Object.entries(item)
                                          .filter(([key]) => key !== 'id' && key !== 'Title')
                                          .map(([key, value]) => (
                                            <Typography key={key} variant="body2" component="span" sx={{ mr: 2 }}>
                                              <strong>{key}:</strong> {value}
                                            </Typography>
                                          ))
                                        }
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        )}
                      </Grid>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Tooltip title="Export to Excel">
                        <IconButton 
                          color="primary" 
                          onClick={() => exportMeetingToExcel(meeting, index)}
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export to PDF">
                        <IconButton 
                          color="secondary" 
                          onClick={() => handleExportMeetingToPDF(meeting, index)}
                          sx={{ mr: 1 }}
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Meeting">
                        <IconButton 
                          color="error" 
                          onClick={() => confirmDeleteMeeting(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Delete Meeting?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this meeting? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={deleteMeeting} color="error" variant="contained">
            Delete
          </Button>
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

export default PastMeetingsPage;
