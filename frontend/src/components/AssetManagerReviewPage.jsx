import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { exportMeetingToPDF } from '../utils/pdfExport';

function AssetManagerReviewPage() {
  const [reviewData, setReviewData] = useState({
    reviewDate: new Date().toISOString().split('T')[0],
    reviewPeriod: '6-months',
    isolationsOver6Months: [],
    isolationsRemoved: [],
    mocRequired: [],
    riskSummary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });

  const [filterPeriod, setFilterPeriod] = useState('6-months');

  useEffect(() => {
    // Load meeting data and filter for Asset Manager review
    loadAssetManagerReviewData();
  }, [filterPeriod]);

  const loadAssetManagerReviewData = () => {
    try {
      console.log('Loading Asset Manager review data...');

      // Get all meetings from localStorage - check multiple possible keys
      const savedMeetings = JSON.parse(localStorage.getItem('savedMeetings')) || [];
      const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings')) || [];
      const ltiMasterList = JSON.parse(localStorage.getItem('ltiMasterList')) || [];
      const currentMeetingIsolations = JSON.parse(localStorage.getItem('currentMeetingIsolations')) || [];
      const currentMeetingResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};

      console.log('Found saved meetings:', savedMeetings.length);
      console.log('Found past meetings:', pastMeetings.length);
      console.log('Found LTI master list:', ltiMasterList.length);
      console.log('Found current meeting isolations:', currentMeetingIsolations.length);

      let isolationsOver6Months = [];
      let isolationsRemoved = [];
      let mocRequired = [];
      let riskSummary = { critical: 0, high: 0, medium: 0, low: 0 };

      // Helper function to process an isolation
      const processIsolation = (isolation, responses, sourceName) => {
        // Get the LTI ID - handle different naming conventions
        const isolationId = isolation.id || isolation.ID || isolation['LTI Number'] || isolation['LTI ID'];
        if (!isolationId) return;

        // Try multiple date field variations
        const plannedStartDateStr = isolation['Planned Start Date'] ||
                                  isolation.plannedStartDate ||
                                  isolation.PlannedStartDate ||
                                  isolation['planned_start_date'] ||
                                  isolation['Start Date'] ||
                                  isolation.startDate ||
                                  isolation['Date Created'] ||
                                  isolation.dateCreated;

        if (!plannedStartDateStr) return;

        const plannedStartDate = new Date(plannedStartDateStr);
        if (isNaN(plannedStartDate.getTime())) return;

        const ageInMonths = (new Date() - plannedStartDate) / (1000 * 60 * 60 * 24 * 30);

        // Get response data for this isolation
        const response = responses[isolationId] || {};

        // Get risk level from response or isolation
        const riskLevel = response.riskLevel ||
                         isolation['Risk Level'] ||
                         isolation.riskLevel ||
                         isolation.Risk ||
                         'N/A';

        // Get MOC required from response or isolation
        const mocRequiredValue = response.mocRequired ||
                                isolation['MOC Required'] ||
                                isolation.mocRequired ||
                                'N/A';

        // Check if isolation is over 6 months and not already added
        if (ageInMonths >= 6 && !isolationsOver6Months.find(iso => iso.id === isolationId)) {
          const isolationData = {
            id: isolationId,
            description: isolation.description || isolation.Description || isolation.Title || isolation.title || isolation['System/Equipment'] || 'No description',
            plannedStartDate: plannedStartDate.toLocaleDateString(),
            ageInMonths: Math.floor(ageInMonths),
            riskLevel: riskLevel,
            mocRequired: mocRequiredValue,
            mocNumber: response.mocNumber || isolation.mocNumber || '',
            status: response.status || isolation.status || 'Active',
            resolutionStrategy: response.resolutionStrategy || isolation.resolutionStrategy || 'N/A',
            escalationReason: response.escalationReason || '',
            meetingDate: sourceName
          };

          isolationsOver6Months.push(isolationData);

          // Count risk levels
          const risk = riskLevel?.toLowerCase() || 'n/a';
          if (risk === 'critical') riskSummary.critical++;
          else if (risk === 'high') riskSummary.high++;
          else if (risk === 'medium') riskSummary.medium++;
          else if (risk === 'low') riskSummary.low++;

          // Check if MOC is required
          if (mocRequiredValue === 'Yes') {
            mocRequired.push(isolationData);
          }
        }

        // Check if isolation has been removed
        if (response.status === 'Completed' || response.status === 'Removed' ||
            isolation.status === 'Completed' || isolation.status === 'Removed') {
          if (!isolationsRemoved.find(iso => iso.id === isolationId)) {
            isolationsRemoved.push({
              id: isolationId,
              description: isolation.description || isolation.Description || isolation.Title || 'No description',
              plannedStartDate: plannedStartDate.toLocaleDateString(),
              ageInMonths: Math.floor(ageInMonths),
              riskLevel: riskLevel,
              mocRequired: mocRequiredValue,
              removalDate: sourceName,
              removalReason: response.comments || 'Completed'
            });
          }
        }
      };

      // Process LTI Master List first (primary source of all LTIs)
      if (ltiMasterList.length > 0) {
        console.log('Processing LTI Master List...');
        ltiMasterList.forEach(isolation => {
          processIsolation(isolation, currentMeetingResponses, 'Master List');
        });
      }

      // Process current meeting isolations
      if (currentMeetingIsolations.length > 0) {
        console.log('Processing current meeting isolations...');
        currentMeetingIsolations.forEach(isolation => {
          processIsolation(isolation, currentMeetingResponses, 'Current Meeting');
        });
      }

      // Process saved meetings
      savedMeetings.forEach((meeting) => {
        let meetingIsolations = [];
        let meetingResponses = {};

        if (meeting.isolations && Array.isArray(meeting.isolations)) {
          meetingIsolations = meeting.isolations;
          meetingResponses = meeting.responses || {};
        } else if (meeting.meetingData?.isolations) {
          meetingIsolations = meeting.meetingData.isolations;
          meetingResponses = meeting.meetingData.responses || {};
        }

        meetingIsolations.forEach(isolation => {
          processIsolation(isolation, meetingResponses, meeting.date || 'Saved Meeting');
        });
      });

      // Process past meetings
      pastMeetings.forEach((meeting) => {
        let meetingIsolations = [];
        let meetingResponses = {};

        if (meeting.isolations && Array.isArray(meeting.isolations)) {
          meetingIsolations = meeting.isolations;
          meetingResponses = meeting.responses || {};
        } else if (meeting.meetingData?.isolations) {
          meetingIsolations = meeting.meetingData.isolations;
          meetingResponses = meeting.meetingData.responses || {};
        }

        meetingIsolations.forEach(isolation => {
          processIsolation(isolation, meetingResponses, meeting.date || 'Past Meeting');
        });
      });

      console.log('Final results:');
      console.log('- Isolations over 6 months:', isolationsOver6Months.length);
      console.log('- Isolations removed:', isolationsRemoved.length);
      console.log('- MOC required:', mocRequired.length);
      console.log('- Risk summary:', riskSummary);

      setReviewData({
        reviewDate: new Date().toISOString().split('T')[0],
        reviewPeriod: filterPeriod,
        isolationsOver6Months,
        isolationsRemoved,
        mocRequired,
        riskSummary
      });

    } catch (error) {
      console.error('Error loading Asset Manager review data:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Create a meeting-like object for PDF export
      const assetManagerMeeting = {
        date: reviewData.reviewDate,
        attendees: ['Asset Manager', 'OMT Team'],
        isolations: reviewData.isolationsOver6Months.map(iso => ({
          id: iso.id,
          description: iso.description,
          'Planned Start Date': iso.plannedStartDate
        })),
        responses: reviewData.isolationsOver6Months.reduce((acc, iso) => {
          acc[iso.id] = {
            riskLevel: iso.riskLevel,
            mocRequired: iso.mocRequired,
            mocNumber: iso.mocNumber,
            comments: `Asset Manager Review - Age: ${iso.ageInMonths} months. ${iso.escalationReason || 'Escalated per WMS Manual requirements.'}`
          };
          return acc;
        }, {}),
        meetingData: {
          executiveSummary: {
            totalIsolationsReviewed: reviewData.isolationsOver6Months.length,
            criticalFindings: reviewData.riskSummary.critical + reviewData.riskSummary.high,
            actionItemsGenerated: reviewData.mocRequired.length,
            relatedIsolationWarnings: []
          },
          riskAnalysis: {
            distribution: {
              Critical: { count: reviewData.riskSummary.critical },
              High: { count: reviewData.riskSummary.high },
              Medium: { count: reviewData.riskSummary.medium },
              Low: { count: reviewData.riskSummary.low }
            }
          }
        }
      };

      const result = await exportMeetingToPDF(assetManagerMeeting);
      
      if (result.success) {
        alert('Asset Manager Review PDF exported successfully!');
      } else {
        alert(`Error exporting PDF: ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting Asset Manager Review PDF:', error);
      alert('Error exporting PDF. Please try again.');
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 2, color: 'warning.main' }} />
          Asset Manager 6-Month Review
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          WMS Manual Compliance - Review of LTIs unresolved after six months
        </Typography>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Review Period</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                label="Review Period"
              >
                <MenuItem value="6-months">Last 6 Months</MenuItem>
                <MenuItem value="12-months">Last 12 Months</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Review Date"
              value={reviewData.reviewDate}
              onChange={(e) => setReviewData({...reviewData, reviewDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={loadAssetManagerReviewData}
                startIcon={<ScheduleIcon />}
              >
                Refresh Data
              </Button>
              <Button
                variant="contained"
                onClick={handleExportPDF}
                startIcon={<AssignmentIcon />}
                color="primary"
              >
                Export PDF Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* WMS Manual Compliance Alert */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <strong>WMS Manual Requirement:</strong>
        </Typography>
        <Typography>
          • LTIs unresolved after six months must be escalated to the Asset Manager for evaluation<br/>
          • The OMT team and Asset Manager meet every six months to review unresolved or critical LTIs<br/>
          • Focus on prioritizing resolution, risk mitigation, or disconnection through MOC process
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">LTIs Over 6 Months</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {reviewData.isolationsOver6Months.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requiring Asset Manager review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">LTIs Removed</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {reviewData.isolationsRemoved.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">MOC Required</Typography>
              </Box>
              <Typography variant="h3" color="primary.main">
                {reviewData.mocRequired.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Management of Change needed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">High Risk</Typography>
              </Box>
              <Typography variant="h3" color="error.main">
                {reviewData.riskSummary.critical + reviewData.riskSummary.high}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical + High risk LTIs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Risk Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Distribution Analysis
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip label={`Critical: ${reviewData.riskSummary.critical}`} color="error" />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip label={`High: ${reviewData.riskSummary.high}`} color="error" variant="outlined" />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip label={`Medium: ${reviewData.riskSummary.medium}`} color="warning" />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip label={`Low: ${reviewData.riskSummary.low}`} color="success" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* LTIs Over 6 Months Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6">
            LTIs Requiring Asset Manager Review (6+ Months)
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Isolation ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Age (Months)</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>MOC Required</TableCell>
                <TableCell>Resolution Strategy</TableCell>
                <TableCell>Last Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewData.isolationsOver6Months.map((isolation, index) => (
                <TableRow key={index}>
                  <TableCell>{isolation.id}</TableCell>
                  <TableCell>{isolation.description}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${isolation.ageInMonths} months`}
                      color={isolation.ageInMonths >= 12 ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={isolation.riskLevel}
                      color={getRiskColor(isolation.riskLevel)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={isolation.mocRequired}
                      color={isolation.mocRequired === 'Yes' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{isolation.resolutionStrategy}</TableCell>
                  <TableCell>{isolation.meetingDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {reviewData.isolationsOver6Months.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No LTIs over 6 months found for the selected period.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* MOC Required Section */}
      {reviewData.mocRequired.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6">
              LTIs Requiring Management of Change (MOC)
            </Typography>
          </Box>
          <List>
            {reviewData.mocRequired.map((isolation, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <BuildIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${isolation.id} - ${isolation.description}`}
                  secondary={`MOC Number: ${isolation.mocNumber || 'Pending'} | Risk: ${isolation.riskLevel} | Age: ${isolation.ageInMonths} months`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Recently Removed LTIs */}
      {reviewData.isolationsRemoved.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6">
              Recently Removed LTIs (Success Stories)
            </Typography>
          </Box>
          <List>
            {reviewData.isolationsRemoved.slice(0, 10).map((isolation, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`${isolation.id} - ${isolation.description}`}
                  secondary={`Removed: ${isolation.removalDate} | Reason: ${isolation.removalReason}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Action Items for Asset Manager */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommended Actions for Asset Manager
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AssignmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Review High-Risk Long-Term Isolations"
              secondary={`${reviewData.riskSummary.critical + reviewData.riskSummary.high} isolations require immediate attention`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BuildIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Prioritize MOC Process"
              secondary={`${reviewData.mocRequired.length} isolations require Management of Change approval`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Schedule Next Review"
              secondary="Set up next 6-month Asset Manager review meeting"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Risk Mitigation Strategy"
              secondary="Develop mitigation plans for isolations that cannot be immediately resolved"
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
}

export default AssetManagerReviewPage;
