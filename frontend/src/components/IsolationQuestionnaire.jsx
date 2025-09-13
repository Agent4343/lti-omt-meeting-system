import { 
  TextField, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Typography, 
  Box,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Grid,
  Paper,
  Button,
  IconButton,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useState, useEffect } from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReportIcon from '@mui/icons-material/Report';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';

function IsolationQuestionnaire({ isolation, onDataChange }) {
  const [formData, setFormData] = useState({
     // Core Risk Assessment
    riskLevel: 'N/A',
    businessImpact: 'N/A',
    riskComments: '',
    
    // MOC Management
    mocRequired: 'N/A',
    mocNumber: '',
    mocStatus: 'N/A',
    mocComments: '',
    
    // Parts & Materials Management (ENHANCED)
    partsRequired: 'N/A',
    partsDescription: '',
    partsExpectedDate: '',
    partsStatus: 'Not Assessed',
    partsComments: '',
    
    // Equipment Disconnection/Removal (NEW SECTION)
    equipmentDisconnectionRequired: 'N/A',
    equipmentRemovalRequired: 'N/A', 
    disconnectionComments: '',
    
    // Support & Resources
    supportRequired: 'N/A',
    supportType: 'N/A',
    supportComments: '',
    
    // Timeline & Planning (ENHANCED)
    plannedResolutionDate: '',
    workWindowRequired: 'N/A',
    priorityLevel: 'N/A',
    
    // Action Management
    actionRequired: 'N/A',
    nextReviewDate: '',
    comments: '',
    
    // WMS Manual Compliance Fields
    corrosionRisk: 'N/A',
    corrosionRiskComment: '',
    deadLegsRisk: 'N/A',
    deadLegsRiskComment: '',
    automationLossRisk: 'N/A',
    automationLossRiskComment: '',
    
    // Asset Manager Review (6-month escalation)
    assetManagerReviewRequired: 'N/A',
    escalationReason: '',
    resolutionStrategy: 'N/A',
    
    // Action Items
    actionItems: []
  });

  // Calculate LTI age if planned start date is available
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

  // Get LTI age for current isolation
  const ltiAge = calculateLTIAge(isolation?.['Planned Start Date'] || isolation?.plannedStartDate || isolation?.PlannedStartDate);
  const plannedStartDate = isolation?.['Planned Start Date'] || isolation?.plannedStartDate || isolation?.PlannedStartDate;

  // State for previous meeting data
  const [previousMeetingData, setPreviousMeetingData] = useState(null);
  const [showPreviousData, setShowPreviousData] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);

  // Load existing data for this isolation when component mounts or isolation changes
  useEffect(() => {
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};
    const existingData = savedResponses[isolation.id];
    
    // ENHANCED DETECTION: Check multiple localStorage sources for previous meeting data
    let previousData = null;
    
    console.log('🔍 DEBUGGING PREVIOUS MEETING DETECTION:');
    console.log('Current isolation ID:', isolation.id);
    
    // Check all possible localStorage keys for previous meeting data
    const possibleKeys = ['savedMeetings', 'pastMeetings', 'previousMeetingResponses'];
    
    for (const key of possibleKeys) {
      const data = JSON.parse(localStorage.getItem(key)) || [];
      console.log(`📋 Checking ${key}:`, data);
      
      if (key === 'previousMeetingResponses') {
        // Direct responses object
        if (data[isolation.id]) {
          previousData = {
            ...data[isolation.id],
            meetingDate: 'Previous Meeting',
            meetingName: 'Previous Meeting'
          };
          console.log('✅ Found previous data in previousMeetingResponses:', previousData);
          break;
        }
      } else if (Array.isArray(data)) {
        // Array of meetings
        for (const meeting of data) {
          if (meeting.responses && meeting.responses[isolation.id]) {
            previousData = {
              ...meeting.responses[isolation.id],
              meetingDate: meeting.date || 'Previous Meeting',
              meetingName: meeting.name || 'Previous Meeting'
            };
            console.log(`✅ Found previous data in ${key}:`, previousData);
            break;
          }
        }
        if (previousData) break;
      }
    }
    
    // Additional debug: Check what's actually in localStorage
    console.log('🔍 ALL LOCALSTORAGE KEYS:', Object.keys(localStorage));
    Object.keys(localStorage).forEach(key => {
      if (key.includes('meeting') || key.includes('Meeting') || key.includes('response') || key.includes('Response')) {
        console.log(`📋 ${key}:`, JSON.parse(localStorage.getItem(key) || '{}'));
      }
    });
    
    // Check if previous data is meaningful (not just all N/A values)
    const isMeaningfulData = (data) => {
      if (!data) return false;
      
      // Check if any of the key fields have non-N/A values
      const keyFields = ['riskLevel', 'mocRequired', 'actionRequired', 'corrosionRisk', 'deadLegsRisk', 'automationLossRisk'];
      const hasNonNAValues = keyFields.some(field => data[field] && data[field] !== 'N/A' && data[field] !== '');
      
      // Check if there are any comments
      const commentFields = ['comments', 'riskLevelComment', 'mocRequiredComment', 'actionRequiredComment', 
                           'corrosionRiskComment', 'deadLegsRiskComment', 'automationLossRiskComment'];
      const hasComments = commentFields.some(field => data[field] && data[field].trim() !== '');
      
      // Check if there are action items
      const hasActionItems = data.actionItems && Array.isArray(data.actionItems) && data.actionItems.length > 0;
      
      return hasNonNAValues || hasComments || hasActionItems;
    };
    
    const meaningfulData = isMeaningfulData(previousData);
    
    console.log('🎯 FINAL RESULT:');
    console.log('Previous data found:', !!previousData);
    console.log('Previous data is meaningful:', meaningfulData);
    console.log('Show previous data:', !!previousData && meaningfulData);
    if (previousData) {
      console.log('Previous data details:', previousData);
      console.log('Data analysis:');
      console.log('- Risk Level:', previousData.riskLevel);
      console.log('- MOC Required:', previousData.mocRequired);
      console.log('- Action Required:', previousData.actionRequired);
      console.log('- Has Comments:', !!(previousData.comments && previousData.comments.trim()));
      console.log('- Has Action Items:', !!(previousData.actionItems && previousData.actionItems.length > 0));
    }
    
    // Only show previous data if it exists AND is meaningful
    setPreviousMeetingData(previousData);
    setShowPreviousData(!!previousData && meaningfulData);
    
    // If we found previous data but it's not meaningful, log a warning
    if (previousData && !meaningfulData) {
      console.log('⚠️ WARNING: Previous meeting data found but contains only default N/A values');
      console.log('This suggests the previous meeting was saved without completing the assessment');
    }
    
    if (existingData) {
       // Load existing data for this isolation - INCLUDING all new fields
      setFormData({
        // Core Risk Assessment
        riskLevel: existingData.riskLevel || 'N/A',
        businessImpact: existingData.businessImpact || 'N/A',
        riskComments: existingData.riskComments || '',
        
        // MOC Management
        mocRequired: existingData.mocRequired || 'N/A',
        mocNumber: existingData.mocNumber || '',
        mocStatus: existingData.mocStatus || 'N/A',
        mocComments: existingData.mocComments || '',
        
        // Parts & Materials Management
        partsRequired: existingData.partsRequired || 'N/A',
        partsDescription: existingData.partsDescription || '',
        partsExpectedDate: existingData.partsExpectedDate || '',
        partsStatus: existingData.partsStatus || 'Not Assessed',
        partsComments: existingData.partsComments || '',
        
        // Equipment Disconnection/Removal
        equipmentDisconnectionRequired: existingData.equipmentDisconnectionRequired || 'N/A',
        equipmentRemovalRequired: existingData.equipmentRemovalRequired || 'N/A',
        disconnectionComments: existingData.disconnectionComments || '',
        
        // Support & Resources
        supportRequired: existingData.supportRequired || 'N/A',
        supportType: existingData.supportType || 'N/A',
        supportComments: existingData.supportComments || '',
        
        // Timeline & Planning
        plannedResolutionDate: existingData.plannedResolutionDate || '',
        workWindowRequired: existingData.workWindowRequired || 'N/A',
        priorityLevel: existingData.priorityLevel || 'N/A',
        
        // Action Management
        actionRequired: existingData.actionRequired || 'N/A',
        nextReviewDate: existingData.nextReviewDate || '',
        comments: existingData.comments || '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: existingData.corrosionRisk || 'N/A',
        corrosionRiskComment: existingData.corrosionRiskComment || '',
        deadLegsRisk: existingData.deadLegsRisk || 'N/A',
        deadLegsRiskComment: existingData.deadLegsRiskComment || '',
        automationLossRisk: existingData.automationLossRisk || 'N/A',
        automationLossRiskComment: existingData.automationLossRiskComment || '',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: existingData.assetManagerReviewRequired || 'N/A',
        escalationReason: existingData.escalationReason || '',
        resolutionStrategy: existingData.resolutionStrategy || 'N/A',
        
        // Action Items
        actionItems: existingData.actionItems || []
      });
    } else if (previousData) {
       // If no current data but we have previous data, populate with previous data
      setFormData({
        // Core Risk Assessment
        riskLevel: previousData.riskLevel || 'N/A',
        businessImpact: previousData.businessImpact || 'N/A',
        riskComments: previousData.riskComments || '',
        
        // MOC Management
        mocRequired: previousData.mocRequired || 'N/A',
        mocNumber: previousData.mocNumber || '',
        mocStatus: previousData.mocStatus || 'N/A',
        mocComments: previousData.mocComments || '',
        
        // Parts & Materials Management
        partsRequired: previousData.partsRequired || 'N/A',
        partsDescription: previousData.partsDescription || '',
        partsExpectedDate: previousData.partsExpectedDate || '',
        partsStatus: previousData.partsStatus || 'Not Assessed',
        partsComments: previousData.partsComments || '',
        
        // Equipment Disconnection/Removal
        equipmentDisconnectionRequired: previousData.equipmentDisconnectionRequired || 'N/A',
        equipmentRemovalRequired: previousData.equipmentRemovalRequired || 'N/A',
        disconnectionComments: previousData.disconnectionComments || '',
        
        // Support & Resources
        supportRequired: previousData.supportRequired || 'N/A',
        supportType: previousData.supportType || 'N/A',
        supportComments: previousData.supportComments || '',
        
        // Timeline & Planning
        plannedResolutionDate: previousData.plannedResolutionDate || '',
        workWindowRequired: previousData.workWindowRequired || 'N/A',
        priorityLevel: previousData.priorityLevel || 'N/A',
        
        // Action Management
        actionRequired: previousData.actionRequired || 'N/A',
        nextReviewDate: previousData.nextReviewDate || '',
        comments: previousData.comments || '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: previousData.corrosionRisk || 'N/A',
        corrosionRiskComment: previousData.corrosionRiskComment || '',
        deadLegsRisk: previousData.deadLegsRisk || 'N/A',
        deadLegsRiskComment: previousData.deadLegsRiskComment || '',
        automationLossRisk: previousData.automationLossRisk || 'N/A',
        automationLossRiskComment: previousData.automationLossRiskComment || '',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: previousData.assetManagerReviewRequired || 'N/A',
        escalationReason: previousData.escalationReason || '',
        resolutionStrategy: previousData.resolutionStrategy || 'N/A',
        
        // Action Items
        actionItems: previousData.actionItems || []
      });
    } else {
       // Reset to defaults for new isolation - INCLUDING all new fields
      setFormData({
        // Core Risk Assessment
        riskLevel: 'N/A',
        businessImpact: 'N/A',
        riskComments: '',
        
        // MOC Management
        mocRequired: 'N/A',
        mocNumber: '',
        mocStatus: 'N/A',
        mocComments: '',
        
        // Parts & Materials Management
        partsRequired: 'N/A',
        partsDescription: '',
        partsExpectedDate: '',
        partsStatus: 'Not Assessed',
        partsComments: '',
        
        // Equipment Disconnection/Removal
        equipmentDisconnectionRequired: 'N/A',
        equipmentRemovalRequired: 'N/A',
        disconnectionComments: '',
        
        // Support & Resources
        supportRequired: 'N/A',
        supportType: 'N/A',
        supportComments: '',
        
        // Timeline & Planning
        plannedResolutionDate: '',
        workWindowRequired: 'N/A',
        priorityLevel: 'N/A',
        
        // Action Management
        actionRequired: 'N/A',
        nextReviewDate: '',
        comments: '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: 'N/A',
        corrosionRiskComment: '',
        deadLegsRisk: 'N/A',
        deadLegsRiskComment: '',
        automationLossRisk: 'N/A',
        automationLossRiskComment: '',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: 'N/A',
        escalationReason: '',
        resolutionStrategy: 'N/A',
        
        // Action Items
        actionItems: []
      });
    }
  }, [isolation.id]);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (onDataChange) {
      onDataChange(isolation.id, newData);
    }
  };

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

  const addActionItem = () => {
    const newActionItems = [...formData.actionItems, { description: '', owner: '' }];
    handleChange('actionItems', newActionItems);
  };

  const removeActionItem = (index) => {
    const newActionItems = formData.actionItems.filter((_, i) => i !== index);
    handleChange('actionItems', newActionItems);
  };

  const handleActionItemChange = (index, field, value) => {
    const newActionItems = [...formData.actionItems];
    newActionItems[index] = { ...newActionItems[index], [field]: value };
    handleChange('actionItems', newActionItems);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {isolation.id} - {isolation.description}
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
          {/* Planned Start Date Display */}
          {plannedStartDate && (
            <Chip 
              label={`Started: ${new Date(plannedStartDate).toLocaleDateString()}`}
              color="default"
              size="small"
              variant="outlined"
            />
          )}
          {/* Risk Level Display */}
          {formData.riskLevel && (
            <Chip 
              label={formData.riskLevel} 
              color={getRiskColor(formData.riskLevel)}
              icon={formData.riskLevel === 'High' || formData.riskLevel === 'Critical' ? <WarningIcon /> : null}
            />
          )}
        </Box>
      </Box>

      {/* Enhanced Previous Meeting Data Display */}
      {showPreviousData && previousMeetingData && (
        <Card sx={{ mb: 3, bgcolor: '#e3f2fd', border: '3px solid #2196f3', boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" color="primary.main" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                <ReportIcon sx={{ mr: 1, fontSize: 32 }} />
                🔍 LTI PREVIOUSLY REVIEWED
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`Last Review: ${previousMeetingData.meetingDate || 'Previous Meeting'}`}
                  color="primary"
                  size="medium"
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip 
                  label="REQUIRES CONFIRMATION"
                  color="warning"
                  size="medium"
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'medium' }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ IMPORTANT: This LTI has been reviewed before
              </Typography>
              <Typography variant="body1">
                <strong>This isolation ({isolation.id}) was previously reviewed in a meeting on {previousMeetingData.meetingDate || 'a previous date'}.</strong>
                <br />
                Please review the previous assessment below and confirm if any updates are required for this isolation.
              </Typography>
            </Alert>


            {/* Previous Comments Display */}
            {previousMeetingData.comments && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#fff3e0', border: '1px solid #ffb74d' }}>
                <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  💬 Previous Comments & Notes
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontStyle: 'italic', 
                  p: 2, 
                  bgcolor: 'white', 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem'
                }}>
                  "{previousMeetingData.comments}"
                </Typography>
              </Paper>
            )}

            {/* Previous Comment Fields Display */}
            {(previousMeetingData.riskLevelComment || previousMeetingData.mocRequiredComment || 
              previousMeetingData.actionRequiredComment || previousMeetingData.corrosionRiskComment || 
              previousMeetingData.deadLegsRiskComment || previousMeetingData.automationLossRiskComment) && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f3e5f5', border: '1px solid #ba68c8' }}>
                <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  📝 Previous Detailed Assessment Comments
                </Typography>
                <Grid container spacing={2}>
                  {previousMeetingData.riskLevelComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Risk Level Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.riskLevelComment}
                      </Typography>
                    </Grid>
                  )}
                  {previousMeetingData.mocRequiredComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">MOC Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.mocRequiredComment}
                      </Typography>
                    </Grid>
                  )}
                  {previousMeetingData.actionRequiredComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Action Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.actionRequiredComment}
                      </Typography>
                    </Grid>
                  )}
                  {previousMeetingData.corrosionRiskComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Corrosion Risk Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.corrosionRiskComment}
                      </Typography>
                    </Grid>
                  )}
                  {previousMeetingData.deadLegsRiskComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Dead Legs Risk Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.deadLegsRiskComment}
                      </Typography>
                    </Grid>
                  )}
                  {previousMeetingData.automationLossRiskComment && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Automation Loss Risk Comment:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 1, fontStyle: 'italic' }}>
                        {previousMeetingData.automationLossRiskComment}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Enhanced Action Buttons */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                <strong>❓ Do you have any other updates required for this isolation?</strong>
                <br />
                Please choose one of the options below to proceed with the review.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={() => {
                  setHasUpdates(false);
                  setShowPreviousData(false);
                  // Keep the previous data as is - it's already loaded
                }}
                sx={{ 
                  minWidth: 200, 
                  py: 1.5, 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  boxShadow: 3
                }}
              >
                ✅ No Updates Required
                <br />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Previous assessment is still accurate
                </Typography>
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => {
                  setHasUpdates(true);
                  setShowPreviousData(false);
                }}
                sx={{ 
                  minWidth: 200, 
                  py: 1.5, 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  boxShadow: 3
                }}
              >
                📝 Updates Required
                <br />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Need to modify the assessment
                </Typography>
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => setShowPreviousData(false)}
                sx={{ 
                  minWidth: 150, 
                  py: 1.5, 
                  fontSize: '1rem'
                }}
              >
                👁️ Hide Previous Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Show update notification if user indicated updates are required */}
      {hasUpdates && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Updates Required:</strong> Please review and update the information below as needed.
        </Alert>
      )}

       {/* INDUSTRY STANDARD LTI RISK MANAGEMENT QUESTIONS */}
      
      {/* Section 1: Risk Assessment */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1, color: 'error.main' }} />
            Section 1: Risk Assessment
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Overall Risk Level</FormLabel>
                <RadioGroup 
                  row 
                  value={formData.riskLevel} 
                  onChange={(e) => handleChange('riskLevel', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                  <FormControlLabel value="Critical" control={<Radio size="small" />} label="Critical" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Business Impact</FormLabel>
                <RadioGroup 
                  row 
                  value={formData.businessImpact} 
                  onChange={(e) => handleChange('businessImpact', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                  <FormControlLabel value="Critical" control={<Radio size="small" />} label="Critical" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                size="small"
                label="Risk Assessment Comments"
                value={formData.riskComments} 
                onChange={(e) => handleChange('riskComments', e.target.value)}
                placeholder="Explain risk level and business impact assessment..."
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 2: MOC Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
            Section 2: MOC (Management of Change)
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Is MOC Required?</FormLabel>
                <RadioGroup 
                  value={formData.mocRequired} 
                  onChange={(e) => handleChange('mocRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Under Review" control={<Radio size="small" />} label="Under Review" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {formData.mocRequired === 'Yes' && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    size="small"
                    label="MOC Number" 
                    value={formData.mocNumber} 
                    onChange={(e) => handleChange('mocNumber', e.target.value)}
                    placeholder="Enter MOC number"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>MOC Status</InputLabel>
                    <Select
                      value={formData.mocStatus}
                      onChange={(e) => handleChange('mocStatus', e.target.value)}
                      label="MOC Status"
                    >
                      <MenuItem value="Submitted">Submitted</MenuItem>
                      <MenuItem value="Approved">Approved</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                size="small"
                label="MOC Comments"
                value={formData.mocComments} 
                onChange={(e) => handleChange('mocComments', e.target.value)}
                placeholder="MOC justification, timeline, barriers, etc."
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 3: Parts & Materials Management (ENHANCED) */}
      <Card sx={{ mb: 3, bgcolor: '#e8f5e8' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1, color: 'success.main' }} />
            Section 3: Parts & Materials ⭐ ENHANCED
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Are Parts Required?</FormLabel>
                <RadioGroup 
                  value={formData.partsRequired} 
                  onChange={(e) => handleChange('partsRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Unknown" control={<Radio size="small" />} label="Unknown" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {(formData.partsRequired === 'Yes' || formData.partsRequired === 'Unknown') && (
              <>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Parts Status</InputLabel>
                    <Select
                      value={formData.partsStatus}
                      onChange={(e) => handleChange('partsStatus', e.target.value)}
                      label="Parts Status"
                    >
                      <MenuItem value="Not Assessed">Not Assessed</MenuItem>
                      <MenuItem value="Not Ordered">Not Ordered</MenuItem>
                      <MenuItem value="Ordered">Ordered</MenuItem>
                      <MenuItem value="In Transit">In Transit</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Installed">Installed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField 
                    fullWidth 
                    size="small"
                    type="date"
                    label="Expected Part Arrival Date ⭐"
                    value={formData.partsExpectedDate} 
                    onChange={(e) => handleChange('partsExpectedDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="When parts expected to arrive"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField 
                    fullWidth 
                    size="small"
                    label="Parts Description"
                    value={formData.partsDescription} 
                    onChange={(e) => handleChange('partsDescription', e.target.value)}
                    placeholder="Brief description of parts needed"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    size="small"
                    label="Parts Comments"
                    value={formData.partsComments} 
                    onChange={(e) => handleChange('partsComments', e.target.value)}
                    placeholder="Vendor info, lead time, alternatives, procurement status..."
                    multiline
                    rows={2}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Section 4: Equipment Disconnection/Removal (NEW SECTION) */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1, color: 'warning.main' }} />
            Section 4: Equipment Management ⭐ NEW
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Equipment Disconnection Required?</FormLabel>
                <RadioGroup 
                  value={formData.equipmentDisconnectionRequired} 
                  onChange={(e) => handleChange('equipmentDisconnectionRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Partially" control={<Radio size="small" />} label="Partially" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Equipment Removal Required?</FormLabel>
                <RadioGroup 
                  value={formData.equipmentRemovalRequired} 
                  onChange={(e) => handleChange('equipmentRemovalRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Temporarily" control={<Radio size="small" />} label="Temporarily" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth 
                size="small"
                label="Disconnection/Removal Comments"
                value={formData.disconnectionComments} 
                onChange={(e) => handleChange('disconnectionComments', e.target.value)}
                placeholder="Complexity, resources needed, timeline..."
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 5: Support & Resources */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, color: 'info.main' }} />
            Section 5: Support & Resources
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Support Required?</FormLabel>
                <RadioGroup 
                  value={formData.supportRequired} 
                  onChange={(e) => handleChange('supportRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Scheduled" control={<Radio size="small" />} label="Scheduled" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {formData.supportRequired === 'Yes' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type of Support</InputLabel>
                  <Select
                    value={formData.supportType}
                    onChange={(e) => handleChange('supportType', e.target.value)}
                    label="Type of Support"
                  >
                    <MenuItem value="Contractor">Contractor</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Multiple">Multiple</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth 
                size="small"
                label="Support Comments"
                value={formData.supportComments} 
                onChange={(e) => handleChange('supportComments', e.target.value)}
                placeholder="Who, when, what type of support..."
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 6: Timeline & Planning (ENHANCED) */}
      <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
            Section 6: Timeline & Planning ⭐ ENHANCED
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField 
                fullWidth 
                size="small"
                type="date"
                label="Planned Resolution Date ⭐"
                value={formData.plannedResolutionDate} 
                onChange={(e) => handleChange('plannedResolutionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Target completion date"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Work Window Required?</FormLabel>
                <RadioGroup 
                  value={formData.workWindowRequired} 
                  onChange={(e) => handleChange('workWindowRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Shutdown Only" control={<Radio size="small" />} label="Shutdown Only" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority Level</InputLabel>
                <Select
                  value={formData.priorityLevel}
                  onChange={(e) => handleChange('priorityLevel', e.target.value)}
                  label="Priority Level"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField 
                fullWidth 
                size="small"
                type="date"
                label="Next Review Date"
                value={formData.nextReviewDate} 
                onChange={(e) => handleChange('nextReviewDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="When to review again"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 7: Action Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ReportIcon sx={{ mr: 1, color: 'secondary.main' }} />
            Section 7: Action Management
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Action Required?</FormLabel>
                <RadioGroup 
                  value={formData.actionRequired} 
                  onChange={(e) => handleChange('actionRequired', e.target.value)}
                >
                  <FormControlLabel value="None" control={<Radio size="small" />} label="None" />
                  <FormControlLabel value="Monitor" control={<Radio size="small" />} label="Monitor" />
                  <FormControlLabel value="Plan Work" control={<Radio size="small" />} label="Plan Work" />
                  <FormControlLabel value="Urgent" control={<Radio size="small" />} label="Urgent" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                size="small"
                label="Comments & Additional Notes"
                value={formData.comments} 
                onChange={(e) => handleChange('comments', e.target.value)}
                placeholder="Key observations, concerns, recommendations..."
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 8: WMS Manual Risk Assessment */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            Section 8: WMS Manual Risk Assessment
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>WMS Manual Requirement:</strong> All LTIs must be assessed for these specific risk categories.
          </Alert>
          
          <Grid container spacing={3}>
            {/* Corrosion Risk */}
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Corrosion Risk</FormLabel>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Risk of metal degradation
                </Typography>
                <RadioGroup 
                  value={formData.corrosionRisk} 
                  onChange={(e) => handleChange('corrosionRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
                <TextField 
                  fullWidth 
                  size="small"
                  label="Corrosion Risk Comments"
                  value={formData.corrosionRiskComment} 
                  onChange={(e) => handleChange('corrosionRiskComment', e.target.value)}
                  placeholder="Explain assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              </FormControl>
            </Grid>
            
            {/* Dead Legs Risk */}
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Dead Legs Risk</FormLabel>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Risk from stagnant fluid
                </Typography>
                <RadioGroup 
                  value={formData.deadLegsRisk} 
                  onChange={(e) => handleChange('deadLegsRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
                <TextField 
                  fullWidth 
                  size="small"
                  label="Dead Legs Risk Comments"
                  value={formData.deadLegsRiskComment} 
                  onChange={(e) => handleChange('deadLegsRiskComment', e.target.value)}
                  placeholder="Explain assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              </FormControl>
            </Grid>
            
            {/* Automation Loss Risk */}
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small" fullWidth>
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Automation Loss Risk</FormLabel>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Risk from control system loss
                </Typography>
                <RadioGroup 
                  value={formData.automationLossRisk} 
                  onChange={(e) => handleChange('automationLossRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
                <TextField 
                  fullWidth 
                  size="small"
                  label="Automation Loss Risk Comments"
                  value={formData.automationLossRiskComment} 
                  onChange={(e) => handleChange('automationLossRiskComment', e.target.value)}
                  placeholder="Explain assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Asset Manager 6-Month Review (Show only for LTIs over 6 months) */}
      {(ltiAge.includes('month') && parseInt(ltiAge) >= 6) || ltiAge.includes('year') ? (
        <Box sx={{ mt: 3, p: 2, border: '2px solid #ff9800', borderRadius: 2, bgcolor: '#fff3e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6" color="warning.main">Asset Manager Review Required</Typography>
            <Chip label="6+ MONTHS" color="warning" size="small" sx={{ ml: 2 }} />
          </Box>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>WMS Manual:</strong> LTIs over 6 months require Asset Manager escalation.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Review Status</FormLabel>
                <RadioGroup 
                  value={formData.assetManagerReviewRequired} 
                  onChange={(e) => handleChange('assetManagerReviewRequired', e.target.value)}
                >
                  <FormControlLabel value="Required" control={<Radio size="small" />} label="Required" />
                  <FormControlLabel value="Scheduled" control={<Radio size="small" />} label="Scheduled" />
                  <FormControlLabel value="Completed" control={<Radio size="small" />} label="Completed" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Resolution Strategy</FormLabel>
                <RadioGroup 
                  value={formData.resolutionStrategy} 
                  onChange={(e) => handleChange('resolutionStrategy', e.target.value)}
                >
                  <FormControlLabel value="Prioritize Resolution" control={<Radio size="small" />} label="Prioritize" />
                  <FormControlLabel value="Risk Mitigation" control={<Radio size="small" />} label="Mitigate" />
                  <FormControlLabel value="Disconnection via MOC" control={<Radio size="small" />} label="Disconnect" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth 
                size="small"
                label="Escalation Notes" 
                value={formData.escalationReason || ''} 
                onChange={(e) => handleChange('escalationReason', e.target.value)}
                placeholder="Brief reason for escalation"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Box>
      ) : null}

      {/* Comments Section */}
      <Box sx={{ mt: 3 }}>
        <TextField 
          fullWidth 
          size="small"
          label="Comments & Additional Notes" 
          value={formData.comments} 
          onChange={(e) => handleChange('comments', e.target.value)}
          placeholder="Key observations, concerns, recommendations, or additional information..."
          multiline
          rows={3}
        />
      </Box>

      {/* Validation Alerts */}
      {formData.riskLevel === 'Critical' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>Critical Risk:</strong> Immediate management attention required.
        </Alert>
      )}

      {formData.actionRequired === 'Urgent' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Urgent Action:</strong> Schedule work immediately.
        </Alert>
      )}

      {/* 6-Month Escalation Alert */}
      {(ltiAge.includes('month') && parseInt(ltiAge) >= 6) || ltiAge.includes('year') ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>WMS Manual Compliance:</strong> This LTI ({ltiAge}) requires Asset Manager review and escalation per WMS Manual requirements.
        </Alert>
      ) : null}

      {/* High Risk Assessment Alert */}
      {(formData.corrosionRisk === 'High' || formData.deadLegsRisk === 'High' || formData.automationLossRisk === 'High') && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>High Risk Identified:</strong> Immediate safety assessment and mitigation required.
        </Alert>
      )}

      {/* Action Items Section */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          Action Items
        </Typography>
        
        {formData.actionItems && formData.actionItems.map((item, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Action Item Description"
                  value={item.description || ''}
                  onChange={(e) => handleActionItemChange(index, 'description', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="Describe the action item..."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Owner Name"
                  value={item.owner || ''}
                  onChange={(e) => handleActionItemChange(index, 'owner', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="Who is responsible?"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <IconButton 
                  onClick={() => removeActionItem(index)}
                  color="error"
                  size="small"
                  sx={{ 
                    bgcolor: 'error.light', 
                    color: 'white',
                    '&:hover': { bgcolor: 'error.main' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}
        
        <Button
          startIcon={<AddIcon />}
          onClick={addActionItem}
          variant="outlined"
          color="primary"
          sx={{ mt: 1 }}
        >
          Add Action Item
        </Button>
      </Box>

    </Paper>
  );
}

export default IsolationQuestionnaire;
