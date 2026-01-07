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
  Divider,
  Snackbar,
  Tabs,
  Tab,
  Collapse,
  LinearProgress
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
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { exportAssetManagerReport } from '../utils/pdfExport';

const AssetManagerDashboard = () => {
  const { meetings } = useAppContext();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLTI, setSelectedLTI] = useState(null);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [localMeetings, setLocalMeetings] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [ltiFilterTab, setLtiFilterTab] = useState(0); // 0=All, 1=6+Months, 2=Critical/High, 3=MOC Required
  const [expandedLTI, setExpandedLTI] = useState(null);

  // Load meetings data from multiple localStorage sources
  useEffect(() => {
    const loadMeetingsData = () => {
      try {
        // Check multiple data sources
        const savedMeetings = JSON.parse(localStorage.getItem('savedMeetings') || '[]');
        const pastMeetings = JSON.parse(localStorage.getItem('pastMeetings') || '[]');
        const ltiMasterList = JSON.parse(localStorage.getItem('ltiMasterList') || '[]');
        const currentMeetingResponses = JSON.parse(localStorage.getItem('currentMeetingResponses') || '{}');

        console.log('🔍 Asset Manager Dashboard - Checking all data sources:', {
          savedMeetings: savedMeetings.length,
          pastMeetings: pastMeetings.length,
          ltiMasterList: ltiMasterList.length,
          contextMeetings: meetings.length
        });

        // PRIMARY SOURCE: Use ltiMasterList if it exists (this is the deduplicated source)
        if (ltiMasterList.length > 0) {
          // Create a single synthetic meeting from the master list
          const syntheticMeeting = {
            id: 'master-list',
            name: 'LTI Master List',
            date: new Date().toISOString().split('T')[0],
            isolations: ltiMasterList,
            responses: currentMeetingResponses
          };

          console.log('📊 Using LTI Master List as primary source:', ltiMasterList.length, 'LTIs');
          setLocalMeetings([syntheticMeeting]);
          return;
        }

        // FALLBACK: If no master list, deduplicate LTIs from meetings by ID
        const seenLTIIds = new Set();
        const uniqueIsolations = [];

        // Collect all isolations from pastMeetings and savedMeetings
        const allMeetingSources = [...pastMeetings, ...savedMeetings];

        allMeetingSources.forEach(meeting => {
          if (meeting.isolations) {
            meeting.isolations.forEach(isolation => {
              const ltiId = isolation.id || isolation.ID || isolation['LTI Number'] || isolation['LTI ID'];
              if (ltiId && !seenLTIIds.has(ltiId)) {
                seenLTIIds.add(ltiId);
                uniqueIsolations.push(isolation);
              }
            });
          }
        });

        if (uniqueIsolations.length > 0) {
          const syntheticMeeting = {
            id: 'combined-meetings',
            name: 'Combined Meeting Data',
            date: new Date().toISOString().split('T')[0],
            isolations: uniqueIsolations,
            responses: currentMeetingResponses
          };
          console.log('📊 Created deduplicated meeting data:', uniqueIsolations.length, 'unique LTIs');
          setLocalMeetings([syntheticMeeting]);
          return;
        }

        // Last resort: use context meetings
        if (meetings.length > 0) {
          console.log('📊 Using context data:', meetings.length, 'meetings');
          setLocalMeetings(meetings);
          return;
        }

        console.log('📊 No LTI data found');
        setLocalMeetings([]);

      } catch (error) {
        console.error('❌ Error reading data:', error);
        setLocalMeetings(meetings);
      }
    };

    // Load immediately
    loadMeetingsData();

    // Refresh every 2 seconds to pick up changes
    const interval = setInterval(loadMeetingsData, 2000);

    return () => clearInterval(interval);
  }, [meetings]);

  // Function to load test data automatically
  const loadAssetManagerTestData = () => {
    try {
      console.log('🧪 Auto-loading Asset Manager test data...');
      
      // Create meetings with proper isolations and responses structure
      const meetingsWithAgedLTIs = [
        {
          id: 'meeting-001',
          name: 'LTI OMT Meeting - June 2023',
          date: '2023-06-15',
          attendees: ['Asset Manager', 'OMT Team', 'Operations Manager'],
          isolations: [
            {
              id: 'CAHE-001-OLD',
              description: 'Heat Exchanger Long-term Isolation',
              'System/Equipment': 'CAHE-001-HX-001',
              'Planned Start Date': '2023-06-01',
              'Risk Level': 'High',
              'MOC Required': 'Yes',
              'Equipment Issues': 'Yes'
            },
            {
              id: 'CAHE-002-OLD',
              description: 'Pump Isolation - Extended',
              'System/Equipment': 'CAHE-002-P-001',
              'Planned Start Date': '2023-07-15',
              'Risk Level': 'Medium',
              'MOC Required': 'Yes',
              'Equipment Issues': 'No'
            }
          ],
          responses: {
            'CAHE-001-OLD': {
              riskLevel: 'High',
              businessImpact: 'Medium',
              mocRequired: 'Yes',
              mocStatus: 'In Progress',
              mocNumber: 'MOC-2023-001',
              partsRequired: 'Yes',
              partsStatus: 'Ordered',
              partsExpectedDate: '2025-02-15',
              equipmentDisconnectionRequired: 'Yes',
              equipmentRemovalRequired: 'No',
              plannedResolutionDate: '2025-03-01',
              actionRequired: 'Plan Work',
              corrosionRisk: 'High',
              deadLegsRisk: 'Medium',
              automationLossRisk: 'Low',
              comments: 'Critical long-term isolation requiring Asset Manager review',
              actionItems: [
                { description: 'Complete MOC documentation', owner: 'Engineering Team' },
                { description: 'Schedule equipment disconnection', owner: 'Maintenance Team' }
              ]
            },
            'CAHE-002-OLD': {
              riskLevel: 'Medium',
              businessImpact: 'Low',
              mocRequired: 'Yes',
              mocStatus: 'Completed',
              mocNumber: 'MOC-2023-002',
              partsRequired: 'No',
              partsStatus: 'Not Required',
              equipmentDisconnectionRequired: 'No',
              equipmentRemovalRequired: 'No',
              plannedResolutionDate: '2025-06-01',
              actionRequired: 'Monitor',
              corrosionRisk: 'Low',
              deadLegsRisk: 'Low',
              automationLossRisk: 'Medium',
              comments: 'Well-managed long-term isolation'
            }
          }
        },
        {
          id: 'meeting-002',
          name: 'LTI OMT Meeting - January 2023',
          date: '2023-01-20',
          attendees: ['Asset Manager', 'OMT Team', 'Safety Manager'],
          isolations: [
            {
              id: 'CAHE-003-VERY-OLD',
              description: 'Critical Valve Isolation',
              'System/Equipment': 'CAHE-003-V-001',
              'Planned Start Date': '2022-12-01',
              'Risk Level': 'High',
              'MOC Required': 'Yes',
              'Equipment Issues': 'Yes'
            },
            {
              id: 'CAHE-004-OLD',
              description: 'Piping Section Isolation',
              'System/Equipment': 'CAHE-004-P-002',
              'Planned Start Date': '2023-01-20',
              'Risk Level': 'Medium',
              'MOC Required': 'No',
              'Equipment Issues': 'Yes'
            }
          ],
          responses: {
            'CAHE-003-VERY-OLD': {
              riskLevel: 'High',
              businessImpact: 'High',
              mocRequired: 'Yes',
              mocStatus: 'Required',
              mocNumber: '',
              partsRequired: 'Yes',
              partsStatus: 'Not Ordered',
              partsExpectedDate: '',
              equipmentDisconnectionRequired: 'Yes',
              equipmentRemovalRequired: 'Yes',
              plannedResolutionDate: '',
              actionRequired: 'Urgent',
              corrosionRisk: 'High',
              deadLegsRisk: 'High',
              automationLossRisk: 'High',
              comments: 'CRITICAL: This isolation has been active for over 2 years and requires immediate Asset Manager attention',
              actionItems: [
                { description: 'Immediate MOC submission required', owner: 'Engineering Manager' },
                { description: 'Equipment removal planning', owner: 'Asset Manager' },
                { description: 'Risk assessment update', owner: 'Safety Team' }
              ]
            },
            'CAHE-004-OLD': {
              riskLevel: 'Medium',
              businessImpact: 'Medium',
              mocRequired: 'No',
              mocStatus: 'Not Required',
              partsRequired: 'Yes',
              partsStatus: 'Available',
              equipmentDisconnectionRequired: 'No',
              equipmentRemovalRequired: 'Yes',
              plannedResolutionDate: '2025-04-01',
              actionRequired: 'Plan Work',
              corrosionRisk: 'Medium',
              deadLegsRisk: 'Low',
              automationLossRisk: 'Low',
              comments: 'Planned equipment removal will resolve this long-term isolation'
            }
          }
        },
        {
          id: 'meeting-003',
          name: 'LTI OMT Meeting - March 2024',
          date: '2024-03-10',
          attendees: ['Asset Manager', 'OMT Team'],
          isolations: [
            {
              id: 'CAHE-005-MEDIUM',
              description: 'Instrument Isolation',
              'System/Equipment': 'CAHE-005-I-001',
              'Planned Start Date': '2024-03-01',
              'Risk Level': 'Low',
              'MOC Required': 'Yes',
              'Equipment Issues': 'No'
            },
            {
              id: 'CAHE-007-BORDERLINE',
              description: 'Compressor Isolation',
              'System/Equipment': 'CAHE-007-C-001',
              'Planned Start Date': '2024-07-01',
              'Risk Level': 'Medium',
              'MOC Required': 'Yes',
              'Equipment Issues': 'Yes'
            }
          ],
          responses: {
            'CAHE-005-MEDIUM': {
              riskLevel: 'Low',
              businessImpact: 'Low',
              mocRequired: 'Yes',
              mocStatus: 'Submitted',
              mocNumber: 'MOC-2024-005',
              partsRequired: 'No',
              partsStatus: 'Not Required',
              equipmentDisconnectionRequired: 'No',
              equipmentRemovalRequired: 'No',
              plannedResolutionDate: '2025-01-01',
              actionRequired: 'Monitor',
              corrosionRisk: 'Low',
              deadLegsRisk: 'Medium',
              automationLossRisk: 'Low',
              comments: 'Well-managed isolation approaching 1 year'
            },
            'CAHE-007-BORDERLINE': {
              riskLevel: 'Medium',
              businessImpact: 'Medium',
              mocRequired: 'Yes',
              mocStatus: 'Required',
              mocNumber: '',
              partsRequired: 'Yes',
              partsStatus: 'Ordered',
              partsExpectedDate: '2025-02-01',
              equipmentDisconnectionRequired: 'Yes',
              equipmentRemovalRequired: 'No',
              plannedResolutionDate: '2025-03-15',
              actionRequired: 'Plan Work',
              corrosionRisk: 'Medium',
              deadLegsRisk: 'Low',
              automationLossRisk: 'Medium',
              comments: 'Borderline 6-month isolation requiring Asset Manager review'
            }
          }
        }
      ];

      // Save meetings to localStorage
      localStorage.setItem('savedMeetings', JSON.stringify(meetingsWithAgedLTIs));

      // Also save to currentMeetingIsolations for compatibility
      const allIsolations = [];
      meetingsWithAgedLTIs.forEach(meeting => {
        if (meeting.isolations) {
          allIsolations.push(...meeting.isolations);
        }
      });
      localStorage.setItem('currentMeetingIsolations', JSON.stringify(allIsolations));

      // Update local state immediately
      setLocalMeetings(meetingsWithAgedLTIs);
      
      console.log('✅ Asset Manager Test Data Auto-loaded Successfully!');
      console.log('📊 Dashboard should now show: Total LTIs: 6, 6+ Months Old: 6, MOCs Required: 5');

    } catch (error) {
      console.error('❌ Error auto-loading test data:', error);
    }
  };

  // Debug log whenever meetings change
  useEffect(() => {
    console.log('🔄 Asset Manager Dashboard - meetings updated:', {
      contextMeetings: meetings.length,
      localMeetings: localMeetings.length
    });
  }, [meetings, localMeetings]);

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

  // Process all LTI data from meetings - use localMeetings instead of meetings
  const processedLTIData = useMemo(() => {
    const allLTIs = [];

    console.log('🔍 Processing LTI Data - localMeetings:', localMeetings);

    localMeetings.forEach(meeting => {
      console.log('📋 Processing meeting:', meeting.id, meeting.date);
      console.log('   - Has isolations:', !!meeting.isolations, meeting.isolations?.length || 0);
      console.log('   - Has responses:', !!meeting.responses, Object.keys(meeting.responses || {}).length);

      if (meeting.isolations) {
        const responses = meeting.responses || {};

        meeting.isolations.forEach(isolation => {
          // Get the LTI ID - handle different naming conventions
          const ltiId = isolation.id || isolation.ID || isolation['LTI Number'] || isolation['LTI ID'] || `LTI-${allLTIs.length + 1}`;

          const response = responses[ltiId] || {};

          // Handle different date field names
          const startDate = isolation['Planned Start Date'] ||
                           isolation.plannedStartDate ||
                           isolation['Start Date'] ||
                           isolation.startDate ||
                           isolation['Date Created'] ||
                           isolation.dateCreated;

          const ageInfo = calculateLTIAge(startDate);

          // Get description from various possible fields
          const description = isolation.description ||
                             isolation.Description ||
                             isolation.Title ||
                             isolation.title ||
                             isolation['System/Equipment'] ||
                             isolation.equipment ||
                             'No description';

          // Get risk level from isolation or response (handle many field name variations)
          const riskLevel = response.riskLevel ||
                           isolation['Risk Level'] ||
                           isolation.riskLevel ||
                           isolation.Risk ||
                           isolation.risk ||
                           isolation['Risk Assessment'] ||
                           isolation.riskAssessment ||
                           'N/A';

          // Get MOC required from isolation or response
          const mocRequired = response.mocRequired ||
                             isolation['MOC Required'] ||
                             isolation.mocRequired ||
                             isolation['MOC'] ||
                             isolation.moc ||
                             'N/A';

          // Get MOC status from isolation or response
          const mocStatusValue = response.mocStatus ||
                                isolation['MOC Status'] ||
                                isolation.mocStatus ||
                                isolation['MOCStatus'] ||
                                isolation.MocStatus ||
                                'N/A';

          // Get Parts status from isolation or response
          const partsStatusValue = response.partsStatus ||
                                  isolation['Parts Status'] ||
                                  isolation.partsStatus ||
                                  isolation['PartsStatus'] ||
                                  isolation.PartsStatus ||
                                  isolation['Parts'] ||
                                  'N/A';

          // Get equipment issues
          const equipmentIssuesValue = isolation['Equipment Issues'] ||
                                       isolation.equipmentIssues ||
                                       isolation['EquipmentIssues'] ||
                                       isolation.equipment_issues ||
                                       response.equipmentIssues ||
                                       'N/A';

          const hasEquipmentIssues = equipmentIssuesValue === 'Yes' ||
                                    response.equipmentDisconnectionRequired === 'Yes' ||
                                    response.equipmentRemovalRequired === 'Yes';

          // Debug: Log first LTI's field names to help identify correct mappings
          if (allLTIs.length === 0) {
            console.log('🔑 First LTI field names:', Object.keys(isolation));
            console.log('📋 First LTI raw data:', isolation);
          }

          console.log(`   - Processing LTI ${ltiId}:`, {
            startDate: startDate,
            ageInfo: ageInfo,
            hasResponse: Object.keys(response).length > 0,
            riskLevel: riskLevel,
            mocStatus: mocStatusValue,
            partsStatus: partsStatusValue,
            equipmentIssues: equipmentIssuesValue
          });

          const ltiData = {
            id: ltiId,
            description: description,
            plannedStartDate: startDate,
            ageInfo: ageInfo,
            meetingDate: meeting.date,
            systemEquipment: isolation['System/Equipment'] || isolation.equipment || '',

            // Assessment data - from response or isolation
            riskLevel: riskLevel,
            businessImpact: response.businessImpact || isolation.businessImpact || 'N/A',
            mocRequired: mocRequired,
            mocNumber: response.mocNumber || isolation.mocNumber || isolation['MOC Number'] || '',
            mocStatus: mocStatusValue,
            partsRequired: response.partsRequired || isolation.partsRequired || isolation['Parts Required'] || 'N/A',
            partsExpectedDate: response.partsExpectedDate || isolation.partsExpectedDate || '',
            partsStatus: partsStatusValue,
            equipmentIssues: equipmentIssuesValue,
            equipmentDisconnectionRequired: response.equipmentDisconnectionRequired || (hasEquipmentIssues ? 'Yes' : 'N/A'),
            equipmentRemovalRequired: response.equipmentRemovalRequired || 'N/A',
            plannedResolutionDate: response.plannedResolutionDate || isolation.plannedResolutionDate || '',
            actionRequired: response.actionRequired || isolation.actionRequired || 'N/A',
            actionItems: response.actionItems || [],
            comments: response.comments || isolation.comments || '',

            // WMS Manual risks
            corrosionRisk: response.corrosionRisk || isolation.corrosionRisk || 'N/A',
            deadLegsRisk: response.deadLegsRisk || isolation.deadLegsRisk || 'N/A',
            automationLossRisk: response.automationLossRisk || isolation.automationLossRisk || 'N/A'
          };

          allLTIs.push(ltiData);
        });
      } else {
        console.log('   ⚠️ Meeting missing isolations');
      }
    });

    console.log('🎯 Final processed LTIs:', allLTIs.length, allLTIs);
    return allLTIs;
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

  // Get status icon based on value
  const getStatusIcon = (status) => {
    if (!status || status === 'N/A') return <PendingIcon sx={{ fontSize: 16, color: 'grey.500' }} />;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('complete') || lowerStatus.includes('approved') || lowerStatus === 'yes') {
      return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('progress') || lowerStatus.includes('submitted') || lowerStatus.includes('ordered')) {
      return <PendingIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    }
    if (lowerStatus.includes('required') || lowerStatus.includes('needed')) {
      return <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    }
    return <PendingIcon sx={{ fontSize: 16, color: 'grey.500' }} />;
  };

  // Filter LTIs based on selected tab
  const getFilteredLTIs = () => {
    switch (ltiFilterTab) {
      case 1: // 6+ Months
        return processedLTIData.filter(lti => lti.ageInfo.isSixMonthsPlus);
      case 2: // Critical/High Risk
        return processedLTIData.filter(lti => lti.riskLevel === 'Critical' || lti.riskLevel === 'High');
      case 3: // MOC Required
        return processedLTIData.filter(lti => lti.mocRequired === 'Yes');
      default: // All
        return processedLTIData;
    }
  };

  const filteredLTIs = getFilteredLTIs();

  const handleViewDetails = (lti) => {
    setSelectedLTI(lti);
    setDetailDialogOpen(true);
  };

  const toggleExpandLTI = (ltiId) => {
    setExpandedLTI(expandedLTI === ltiId ? null : ltiId);
  };

  const generateMeetingAgenda = () => {
    setAgendaDialogOpen(true);
  };

  // Export Asset Manager Report
  const handleExportReport = () => {
    const reportData = {
      period: 'All Time',
      totalLTIs: dashboardStats.totalLTIs,
      allLTIs: processedLTIData,
      sixMonthsPlusLTIs: dashboardStats.sixMonthsPlusLTIs,
      stats: {
        totalLTIs: dashboardStats.totalLTIs,
        sixMonthsPlus: dashboardStats.sixMonthsPlus,
        criticalRisk: dashboardStats.criticalRisk,
        mocRequired: dashboardStats.mocRequired,
        riskDistribution: {
          critical: dashboardStats.criticalRisk,
          high: dashboardStats.highRisk,
          medium: processedLTIData.filter(lti => lti.riskLevel === 'Medium').length,
          low: processedLTIData.filter(lti => lti.riskLevel === 'Low').length
        }
      }
    };

    const result = exportAssetManagerReport(reportData);
    setSnackbar({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Debug:</strong> Context meetings: {meetings.length}, Local meetings: {localMeetings.length}, 
          Total LTIs: {dashboardStats.totalLTIs}, 6+ months: {dashboardStats.sixMonthsPlus}
        </Alert>
      )}

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
            Asset Manager Dashboard
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PdfIcon />}
              onClick={handleExportReport}
              disabled={processedLTIData.length === 0}
            >
              Export Report
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CalendarIcon />}
              onClick={generateMeetingAgenda}
              disabled={dashboardStats.sixMonthsPlus === 0}
            >
              Generate Agenda
            </Button>
          </Box>
        </Box>

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
              <strong>Good News:</strong> No LTIs are currently over 6 months old requiring Asset Manager review.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Complete LTI Status - Full Meal Deal */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
            All LTIs - Complete Status Overview
          </Typography>

          {/* Filter Tabs */}
          <Tabs
            value={ltiFilterTab}
            onChange={(e, newValue) => setLtiFilterTab(newValue)}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`All LTIs (${processedLTIData.length})`} />
            <Tab label={`6+ Months (${dashboardStats.sixMonthsPlus})`} />
            <Tab label={`Critical/High (${dashboardStats.criticalRisk + dashboardStats.highRisk})`} />
            <Tab label={`MOC Required (${dashboardStats.mocRequired})`} />
          </Tabs>

          {filteredLTIs.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' } }}>
                    <TableCell sx={{ color: 'white' }}>LTI ID</TableCell>
                    <TableCell sx={{ color: 'white' }}>Description</TableCell>
                    <TableCell sx={{ color: 'white' }}>Age</TableCell>
                    <TableCell sx={{ color: 'white' }}>Risk</TableCell>
                    <TableCell sx={{ color: 'white' }}>MOC</TableCell>
                    <TableCell sx={{ color: 'white' }}>Parts</TableCell>
                    <TableCell sx={{ color: 'white' }}>Equipment</TableCell>
                    <TableCell sx={{ color: 'white' }}>Resolution</TableCell>
                    <TableCell sx={{ color: 'white' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLTIs.map((lti) => (
                    <React.Fragment key={lti.id}>
                      <TableRow
                        hover
                        onClick={() => toggleExpandLTI(lti.id)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: lti.ageInfo.isSixMonthsPlus ? 'warning.lighter' : 'inherit',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton size="small" sx={{ mr: 0.5 }}>
                              {expandedLTI === lti.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {lti.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lti.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lti.ageInfo.display}
                            size="small"
                            color={lti.ageInfo.isSixMonthsPlus ? (lti.ageInfo.days > 365 ? 'error' : 'warning') : 'default'}
                            variant={lti.ageInfo.isSixMonthsPlus ? 'filled' : 'outlined'}
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getStatusIcon(lti.mocStatus)}
                            <Typography variant="caption">
                              {lti.mocRequired === 'Yes' ? lti.mocStatus : lti.mocRequired}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getStatusIcon(lti.partsStatus)}
                            <Typography variant="caption">
                              {lti.partsRequired === 'Yes' ? lti.partsStatus : lti.partsRequired}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {lti.equipmentIssues || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {lti.plannedResolutionDate ? new Date(lti.plannedResolutionDate).toLocaleDateString() : 'Not Set'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Full Details">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewDetails(lti); }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details Row */}
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, borderBottom: expandedLTI === lti.id ? 1 : 0 }}>
                          <Collapse in={expandedLTI === lti.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                {/* Basic Info */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Basic Information</Typography>
                                  <Typography variant="body2"><strong>System/Equipment:</strong> {lti.systemEquipment || 'N/A'}</Typography>
                                  <Typography variant="body2"><strong>Start Date:</strong> {lti.plannedStartDate ? new Date(lti.plannedStartDate).toLocaleDateString() : 'N/A'}</Typography>
                                  <Typography variant="body2"><strong>Business Impact:</strong> {lti.businessImpact}</Typography>
                                  <Typography variant="body2"><strong>Action Required:</strong> {lti.actionRequired}</Typography>
                                </Grid>

                                {/* MOC Details */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>MOC Information</Typography>
                                  <Typography variant="body2"><strong>MOC Required:</strong> {lti.mocRequired}</Typography>
                                  <Typography variant="body2"><strong>MOC Number:</strong> {lti.mocNumber || 'Not Assigned'}</Typography>
                                  <Typography variant="body2"><strong>MOC Status:</strong> {lti.mocStatus}</Typography>
                                </Grid>

                                {/* Parts & Equipment */}
                                <Grid item xs={12} md={4}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Parts & Equipment</Typography>
                                  <Typography variant="body2"><strong>Parts Required:</strong> {lti.partsRequired}</Typography>
                                  <Typography variant="body2"><strong>Parts Status:</strong> {lti.partsStatus}</Typography>
                                  <Typography variant="body2"><strong>Parts Expected:</strong> {lti.partsExpectedDate ? new Date(lti.partsExpectedDate).toLocaleDateString() : 'N/A'}</Typography>
                                  <Typography variant="body2"><strong>Equipment Disconnection:</strong> {lti.equipmentDisconnectionRequired}</Typography>
                                  <Typography variant="body2"><strong>Equipment Removal:</strong> {lti.equipmentRemovalRequired}</Typography>
                                </Grid>

                                {/* WMS Risks */}
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>WMS Manual Risk Assessment</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip size="small" label={`Corrosion: ${lti.corrosionRisk}`} color={lti.corrosionRisk === 'High' ? 'error' : lti.corrosionRisk === 'Medium' ? 'warning' : 'default'} variant="outlined" />
                                    <Chip size="small" label={`Dead Legs: ${lti.deadLegsRisk}`} color={lti.deadLegsRisk === 'High' ? 'error' : lti.deadLegsRisk === 'Medium' ? 'warning' : 'default'} variant="outlined" />
                                    <Chip size="small" label={`Automation Loss: ${lti.automationLossRisk}`} color={lti.automationLossRisk === 'High' ? 'error' : lti.automationLossRisk === 'Medium' ? 'warning' : 'default'} variant="outlined" />
                                  </Box>
                                </Grid>

                                {/* Comments */}
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>Comments</Typography>
                                  <Typography variant="body2" sx={{ fontStyle: lti.comments ? 'normal' : 'italic', color: lti.comments ? 'text.primary' : 'text.secondary' }}>
                                    {lti.comments || 'No comments recorded'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No LTIs found matching the selected filter.
            </Alert>
          )}

          {/* Summary Stats for Current Filter */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Showing {filteredLTIs.length} LTIs
              {ltiFilterTab === 1 && ' over 6 months old'}
              {ltiFilterTab === 2 && ' with Critical or High risk'}
              {ltiFilterTab === 3 && ' requiring MOC'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption">
                Risk Distribution:
                <Chip size="small" label={`Critical: ${filteredLTIs.filter(l => l.riskLevel === 'Critical').length}`} color="error" sx={{ ml: 0.5, height: 20 }} />
                <Chip size="small" label={`High: ${filteredLTIs.filter(l => l.riskLevel === 'High').length}`} color="warning" sx={{ ml: 0.5, height: 20 }} />
                <Chip size="small" label={`Medium: ${filteredLTIs.filter(l => l.riskLevel === 'Medium').length}`} color="info" sx={{ ml: 0.5, height: 20 }} />
                <Chip size="small" label={`Low: ${filteredLTIs.filter(l => l.riskLevel === 'Low').length}`} color="success" sx={{ ml: 0.5, height: 20 }} />
              </Typography>
            </Box>
          </Box>
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

      {/* Snackbar for feedback */}
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
    </Box>
  );
};

export default AssetManagerDashboard;
