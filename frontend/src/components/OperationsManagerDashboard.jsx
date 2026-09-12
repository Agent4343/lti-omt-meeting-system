import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Error as ErrorIcon,
  Email as EmailIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { exportMeetingToPDF } from '../utils/pdfExport';
import { calculateLTIAge } from '../utils/dateUtils';
import { exportOperationsManagerToCSV } from '../utils/csvExport';
import { openEmailClient, generateOperationsManagerReportEmail, downloadAsFile } from '../utils/emailUtils';

const OperationsManagerDashboard = () => {
  const { meetings } = useAppContext();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLTI, setSelectedLTI] = useState(null);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [localMeetings, setLocalMeetings] = useState([]);
  // Serialized snapshot of the last loaded data, so a refresh that finds
  // nothing new does not replace state with an equal-but-new array.
  const lastSnapshotRef = useRef(null);

  // Load data from localStorage - combine savedMeetings AND pastMeetings
  // Load meetings data from every localStorage source the app writes to.
  useEffect(() => {
    const loadMeetingsData = () => {
      try {
        const savedMeetings = JSON.parse(localStorage.getItem('savedMeetings') || '[]');
        const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings') || '[]');
        const ltiMasterList = JSON.parse(localStorage.getItem('ltiMasterList') || '[]');
        const currentMeetingIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations') || '[]');
        const currentMeetingResponses = JSON.parse(localStorage.getItem('currentMeetingResponses') || '{}');
        const currentMeetingInfo = JSON.parse(localStorage.getItem('currentMeetingInfo') || 'null');

        const allMeetings = [];
        const seenMeetingKeys = new Set();

        // Identity is the meeting id, falling back to timestamp then date for
        // records saved before ids were assigned.
        const addMeeting = (meeting) => {
          if (!meeting.isolations) return;
          const meetingKey = meeting.id || meeting.timestamp || meeting.date;
          if (meetingKey && seenMeetingKeys.has(meetingKey)) return;
          allMeetings.push(meeting);
          if (meetingKey) seenMeetingKeys.add(meetingKey);
        };

        // Finished meetings first - they are the primary source.
        pastMeetings.forEach(addMeeting);
        savedMeetings.forEach(addMeeting);

        // Surface the in-progress meeting so its LTIs are visible before it is
        // finalized.
        if (currentMeetingIsolations.length > 0) {
          const currentMeetingId = currentMeetingInfo?.id || 'current-meeting';
          if (!allMeetings.some(m => m.id === currentMeetingId)) {
            allMeetings.push({
              id: currentMeetingId,
              name: currentMeetingInfo?.name || 'Current Meeting',
              date: currentMeetingInfo?.date || new Date().toISOString().split('T')[0],
              isolations: currentMeetingIsolations,
              responses: currentMeetingResponses
            });
          }
        }

        // Fall back to the master list when no meeting has been held yet.
        if (allMeetings.length === 0 && ltiMasterList.length > 0) {
          allMeetings.push({
            id: 'master-list-meeting',
            name: 'LTI Master List Data',
            date: new Date().toISOString().split('T')[0],
            isolations: ltiMasterList,
            responses: currentMeetingResponses
          });
        }

        // Last resort: whatever the context already holds.
        const resolved = allMeetings.length === 0 && meetings.length > 0
          ? meetings
          : allMeetings;

        // Only push new state when the data actually changed, otherwise every
        // refresh hands down a new array reference and re-runs the memo below.
        const snapshot = JSON.stringify(resolved);
        if (snapshot === lastSnapshotRef.current) return;
        lastSnapshotRef.current = snapshot;

        const totalLTIs = resolved.reduce((sum, m) => sum + (m.isolations?.length || 0), 0);
        console.log(`📊 Operations Manager Dashboard: ${resolved.length} meetings, ${totalLTIs} LTIs`);

        setLocalMeetings(resolved);
      } catch (error) {
        console.error('❌ Error reading data:', error);
        setLocalMeetings(meetings);
      }
    };

    loadMeetingsData();

    // Refresh on writes from other tabs and when this tab regains focus,
    // rather than re-reading everything on a timer.
    const handleStorageChange = (e) => {
      const watched = [
        'savedMeetings',
        'pastMeetings',
        'ltiMasterList',
        'currentMeetingIsolations',
        'currentMeetingResponses',
        'currentMeetingInfo'
      ];
      if (!e.key || watched.includes(e.key)) loadMeetingsData();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadMeetingsData();
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', loadMeetingsData);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', loadMeetingsData);
    };
  }, [meetings]);


  // Process all LTI data from meetings - use localMeetings instead of meetings
  // Deduplicate by isolation ID, keeping the most recent meeting's data
  const processedLTIData = useMemo(() => {
    const ltiMap = new Map(); // Use Map to track unique LTIs by ID

    // Sort meetings by date (oldest first) so newer data overwrites older
    const sortedMeetings = [...localMeetings].sort((a, b) =>
      new Date(a.date || 0) - new Date(b.date || 0)
    );

    sortedMeetings.forEach(meeting => {
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

          // Store by ID - newer meetings will overwrite older ones
          ltiMap.set(isolation.id, ltiData);
        });
      }
    });

    // Convert Map values back to array
    return Array.from(ltiMap.values());
  }, [localMeetings]);

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

  // Export Operations Manager Report as PDF
  const handleExportReport = async () => {
    try {
      const reportData = {
        date: new Date().toISOString().split('T')[0],
        attendees: ['Operations Manager', 'OMT Team'],
        isolations: dashboardStats.sixMonthsPlusLTIs.map(lti => ({
          id: lti.id,
          description: lti.description,
          'Planned Start Date': lti.plannedStartDate
        })),
        responses: dashboardStats.sixMonthsPlusLTIs.reduce((acc, lti) => {
          acc[lti.id] = {
            riskLevel: lti.riskLevel,
            mocRequired: lti.mocRequired,
            mocNumber: lti.mocNumber,
            partsRequired: lti.partsRequired,
            actionRequired: lti.actionRequired,
            comments: `Age: ${lti.ageInfo.display}. ${lti.comments || 'Operations Manager Review Required.'}`
          };
          return acc;
        }, {}),
        meetingData: {
          executiveSummary: {
            totalIsolationsReviewed: dashboardStats.sixMonthsPlus,
            criticalFindings: dashboardStats.criticalRisk + dashboardStats.highRisk,
            actionItemsGenerated: dashboardStats.mocRequired,
            relatedIsolationWarnings: []
          },
          riskAnalysis: {
            distribution: {
              Critical: { count: dashboardStats.criticalRisk },
              High: { count: dashboardStats.highRisk },
              Medium: { count: processedLTIData.filter(lti => lti.riskLevel === 'Medium').length },
              Low: { count: processedLTIData.filter(lti => lti.riskLevel === 'Low').length }
            }
          }
        }
      };

      const result = await exportMeetingToPDF(reportData);
      if (result.success) {
        alert('Operations Manager Report exported successfully!');
      } else {
        alert(`Error exporting report: ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting Operations Manager Report:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const result = exportOperationsManagerToCSV(processedLTIData, 'all');
      if (result.success) {
        alert('CSV exported successfully!');
      } else {
        alert(`Error exporting CSV: ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    }
  };

  // Email Operations Manager Report
  const handleEmailReport = () => {
    try {
      const stats = {
        totalLTIs: dashboardStats.totalLTIs,
        sixMonthsPlus: dashboardStats.sixMonthsPlus,
        criticalRisk: dashboardStats.criticalRisk,
        highRisk: dashboardStats.highRisk,
        mocRequired: dashboardStats.mocRequired,
        equipmentIssues: dashboardStats.equipmentIssues,
        urgentAction: dashboardStats.urgentAction,
        sixMonthsPlusLTIs: dashboardStats.sixMonthsPlusLTIs
      };
      const subject = `Operations Manager LTI Status Report - ${new Date().toLocaleDateString()}`;
      const body = generateOperationsManagerReportEmail(processedLTIData, stats);
      openEmailClient('', subject, body);
      alert('Email client opened with Operations Manager report');
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Error generating email. Please try again.');
    }
  };

  // Save report to SharePoint (downloads JSON for upload)
  const handleSaveToSharePoint = () => {
    try {
      const reportData = {
        reportDate: new Date().toISOString(),
        stats: {
          totalLTIs: dashboardStats.totalLTIs,
          sixMonthsPlus: dashboardStats.sixMonthsPlus,
          criticalRisk: dashboardStats.criticalRisk,
          highRisk: dashboardStats.highRisk,
          mocRequired: dashboardStats.mocRequired
        },
        ltis: processedLTIData
      };
      const filename = `Operations_Manager_Report_${new Date().toISOString().split('T')[0]}.json`;
      downloadAsFile(JSON.stringify(reportData, null, 2), filename, 'application/json');
      alert(`File "${filename}" downloaded. Upload it to your SharePoint document library.`);
    } catch (error) {
      console.error('Error saving to SharePoint:', error);
      alert('Error creating file. Please try again.');
    }
  };

  // Export Meeting Agenda as PDF
  const handleExportAgendaPDF = async () => {
    try {
      const agendaData = {
        date: new Date().toISOString().split('T')[0],
        attendees: ['Operations Manager', 'OMT Team', 'Operations Manager'],
        isolations: dashboardStats.sixMonthsPlusLTIs.map(lti => ({
          id: lti.id,
          description: lti.description,
          'Planned Start Date': lti.plannedStartDate
        })),
        responses: dashboardStats.sixMonthsPlusLTIs.reduce((acc, lti) => {
          acc[lti.id] = {
            riskLevel: lti.riskLevel,
            mocRequired: lti.mocRequired,
            comments: `Meeting Agenda Item - ${lti.ageInfo.display} old, ${lti.riskLevel} risk`
          };
          return acc;
        }, {}),
        meetingData: {
          executiveSummary: {
            totalIsolationsReviewed: dashboardStats.totalLTIs,
            criticalFindings: dashboardStats.criticalRisk + dashboardStats.highRisk,
            actionItemsGenerated: dashboardStats.urgentAction,
            relatedIsolationWarnings: []
          }
        }
      };

      const result = await exportMeetingToPDF(agendaData);
      if (result.success) {
        alert('Meeting Agenda exported successfully!');
        setAgendaDialogOpen(false);
      } else {
        alert(`Error exporting agenda: ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting Meeting Agenda:', error);
      alert('Error exporting agenda. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Debug Info - Always show to help diagnose count issues */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Data Sources:</strong> {localMeetings.length} meetings loaded |
        Unique LTI IDs: {processedLTIData.length} |
        Raw isolation count: {localMeetings.reduce((acc, m) => acc + (m.isolations?.length || 0), 0)}
      </Alert>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
          Operations Manager Dashboard
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>WMS Manual Requirement:</strong> LTIs over 6 months require Operations Manager review every 6 months. 
          This dashboard tracks {dashboardStats.sixMonthsPlus} LTIs requiring management attention.
        </Alert>
      </Box>

      {/* Key Metrics Dashboard */}
      {/* Uniform cards on a plain surface: the previous pastel fills plus a
          chip on only one card made the row look ragged and gave four metrics
          equal visual weight regardless of whether anything was wrong. */}
      <Grid container spacing={2} sx={{ mb: 4 }} alignItems="stretch">
        {[
          {
            label: 'Total LTIs',
            value: dashboardStats.totalLTIs,
            icon: <DashboardIcon />,
            tone: 'primary'
          },
          {
            label: '6+ Months Old',
            value: dashboardStats.sixMonthsPlus,
            icon: <ScheduleIcon />,
            tone: 'warning',
            note: 'Requires review'
          },
          {
            label: 'Critical Risk',
            value: dashboardStats.criticalRisk,
            icon: <ErrorIcon />,
            tone: 'error'
          },
          {
            label: 'MOCs Required',
            value: dashboardStats.mocRequired,
            icon: <AssignmentIcon />,
            tone: 'success'
          }
        ].map(({ label, value, icon, tone, note }) => {
          // Only draw attention to a metric that is actually non-zero.
          const active = Number(value) > 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={label}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: 2,
                      color: active ? `${tone}.main` : 'grey.400',
                      bgcolor: active ? `${tone}.light` : 'grey.100'
                    }}
                  >
                    {icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h2" sx={{ lineHeight: 1.1 }}>
                      {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {label}
                    </Typography>
                    {note && active && (
                      <Typography variant="caption" sx={{ color: `${tone}.main`, fontWeight: 600 }}>
                        {note}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Action Buttons - one primary action, the rest are secondary so the
          row reads as a hierarchy rather than five competing colours. */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<CalendarIcon />}
          onClick={generateMeetingAgenda}
          color="primary"
        >
          Generate Meeting Agenda
        </Button>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" color="inherit" startIcon={<DownloadIcon />} onClick={handleExportReport}>
            Export PDF
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<EmailIcon />} onClick={handleEmailReport}>
            Email Report
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<CloudUploadIcon />} onClick={handleSaveToSharePoint}>
            Save to SharePoint
          </Button>
        </Box>
      </Box>

      {/* 6+ Month LTIs Requiring Review */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            LTIs Over 6 Months - Requiring Operations Manager Review ({dashboardStats.sixMonthsPlus})
          </Typography>
          
          {dashboardStats.sixMonthsPlus > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>LTI ID</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
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
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {lti.description}
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
              <strong>Good News:</strong> No LTIs are currently over 6 months old requiring Operations Manager review.
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
          Operations Manager Review Meeting Agenda
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Operations Manager Review Meeting
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
                <ListItemText primary="Schedule next Operations Manager review (6 months)" />
              </ListItem>
            </List>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendaDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportAgendaPDF}>
            Export Agenda PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OperationsManagerDashboard;
