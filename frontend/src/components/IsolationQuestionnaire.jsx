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
    // Core Assessment (Essential Questions Only)
    riskLevel: 'N/A',
    isolationDuration: '',
    businessImpact: 'N/A',
    
    // Equipment Removal (Key Questions)
    canRemoveEquipment: 'N/A',
    removalComplexity: 'N/A',
    
    // MOC Requirements (Essential)
    mocRequired: 'N/A',
    mocNumber: '',
    mocStatus: 'N/A',
    
    // Parts Assessment (Critical)
    partsRequired: 'N/A',
    partsExpectedDate: '',
    
    // Support Requirements (Key)
    supportRequired: 'N/A',
    
    // Actions & Comments
    actionRequired: 'N/A',
    comments: '',
    
    // WMS Manual Compliance Fields
    // Periodic Risk Assessment (WMS Manual Requirement)
    corrosionRisk: 'N/A',
    deadLegsRisk: 'N/A',
    automationLossRisk: 'N/A',
    
    // Structured Evaluation Fields
    repairSchedule: '',
    disconnectionRequired: 'N/A',
    priorityLevel: 'N/A',
    
    // Asset Manager Review (6-month escalation)
    assetManagerReviewRequired: 'N/A',
    escalationReason: '',
    resolutionStrategy: 'N/A',
    
    // Management Reporting Fields
    reviewStatus: 'Reviewed',
    nextReviewDate: '',
    managementNotes: '',
    
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
      // Load existing data for this isolation - INCLUDING WMS Manual fields
      setFormData({
        // Core Assessment
        riskLevel: existingData.riskLevel || 'N/A',
        isolationDuration: existingData.isolationDuration || '',
        businessImpact: existingData.businessImpact || 'N/A',
        canRemoveEquipment: existingData.canRemoveEquipment || 'N/A',
        removalComplexity: existingData.removalComplexity || 'N/A',
        mocRequired: existingData.mocRequired || 'N/A',
        mocNumber: existingData.mocNumber || '',
        mocStatus: existingData.mocStatus || 'N/A',
        partsRequired: existingData.partsRequired || 'N/A',
        partsExpectedDate: existingData.partsExpectedDate || '',
        supportRequired: existingData.supportRequired || 'N/A',
        actionRequired: existingData.actionRequired || 'N/A',
        comments: existingData.comments || '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: existingData.corrosionRisk || 'N/A',
        deadLegsRisk: existingData.deadLegsRisk || 'N/A',
        automationLossRisk: existingData.automationLossRisk || 'N/A',
        
        // Structured Evaluation Fields
        repairSchedule: existingData.repairSchedule || '',
        disconnectionRequired: existingData.disconnectionRequired || 'N/A',
        priorityLevel: existingData.priorityLevel || 'N/A',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: existingData.assetManagerReviewRequired || 'N/A',
        escalationReason: existingData.escalationReason || '',
        resolutionStrategy: existingData.resolutionStrategy || 'N/A',
        
        // Management Reporting Fields
        reviewStatus: existingData.reviewStatus || 'Reviewed',
        nextReviewDate: existingData.nextReviewDate || '',
        managementNotes: existingData.managementNotes || '',
        
        // Action Items
        actionItems: existingData.actionItems || []
      });
    } else if (previousData) {
      // If no current data but we have previous data, populate with previous data
      setFormData({
        // Core Assessment
        riskLevel: previousData.riskLevel || 'N/A',
        isolationDuration: previousData.isolationDuration || '',
        businessImpact: previousData.businessImpact || 'N/A',
        canRemoveEquipment: previousData.canRemoveEquipment || 'N/A',
        removalComplexity: previousData.removalComplexity || 'N/A',
        mocRequired: previousData.mocRequired || 'N/A',
        mocNumber: previousData.mocNumber || '',
        mocStatus: previousData.mocStatus || 'N/A',
        partsRequired: previousData.partsRequired || 'N/A',
        partsExpectedDate: previousData.partsExpectedDate || '',
        supportRequired: previousData.supportRequired || 'N/A',
        actionRequired: previousData.actionRequired || 'N/A',
        comments: previousData.comments || '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: previousData.corrosionRisk || 'N/A',
        deadLegsRisk: previousData.deadLegsRisk || 'N/A',
        automationLossRisk: previousData.automationLossRisk || 'N/A',
        
        // Structured Evaluation Fields
        repairSchedule: previousData.repairSchedule || '',
        disconnectionRequired: previousData.disconnectionRequired || 'N/A',
        priorityLevel: previousData.priorityLevel || 'N/A',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: previousData.assetManagerReviewRequired || 'N/A',
        escalationReason: previousData.escalationReason || '',
        resolutionStrategy: previousData.resolutionStrategy || 'N/A',
        
        // Management Reporting Fields
        reviewStatus: 'Reviewed',
        nextReviewDate: previousData.nextReviewDate || '',
        managementNotes: previousData.managementNotes || '',
        
        // Action Items
        actionItems: previousData.actionItems || []
      });
    } else {
      // Reset to defaults for new isolation - INCLUDING WMS Manual fields
      setFormData({
        // Core Assessment
        riskLevel: 'N/A',
        isolationDuration: '',
        businessImpact: 'N/A',
        canRemoveEquipment: 'N/A',
        removalComplexity: 'N/A',
        mocRequired: 'N/A',
        mocNumber: '',
        mocStatus: 'N/A',
        partsRequired: 'N/A',
        partsExpectedDate: '',
        supportRequired: 'N/A',
        actionRequired: 'N/A',
        comments: '',
        
        // WMS Manual Compliance Fields
        corrosionRisk: 'N/A',
        deadLegsRisk: 'N/A',
        automationLossRisk: 'N/A',
        
        // Structured Evaluation Fields
        repairSchedule: '',
        disconnectionRequired: 'N/A',
        priorityLevel: 'N/A',
        
        // Asset Manager Review Fields
        assetManagerReviewRequired: 'N/A',
        escalationReason: '',
        resolutionStrategy: 'N/A',
        
        // Management Reporting Fields
        reviewStatus: 'Reviewed',
        nextReviewDate: '',
        managementNotes: '',
        
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

      {/* Essential Questions Only - Clean & Focused */}
      <Grid container spacing={3}>
        {/* Column 1 - Core Assessment */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Risk Level */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Overall Risk Level</FormLabel>
              <RadioGroup 
                row 
                value={formData.riskLevel} 
                onChange={(e) => handleChange('riskLevel', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                <FormControlLabel value="Critical" control={<Radio size="small" />} label="Critical" />
              </RadioGroup>
              {/* Comment field for Risk Level - Show ONLY if not N/A AND not None */}
              {formData.riskLevel && formData.riskLevel !== 'N/A' && formData.riskLevel !== 'None' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`Risk Level Comment (${formData.riskLevel})`}
                  value={formData.riskLevelComment || ''} 
                  onChange={(e) => handleChange('riskLevelComment', e.target.value)}
                  placeholder="Please explain the risk level assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>

            {/* MOC Required */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>MOC Required?</FormLabel>
              <RadioGroup 
                row
                value={formData.mocRequired} 
                onChange={(e) => handleChange('mocRequired', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
              </RadioGroup>
              {/* Comment field for MOC Required - Show ONLY if Yes or No (not N/A) */}
              {formData.mocRequired && formData.mocRequired !== 'N/A' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`MOC Comment (${formData.mocRequired})`}
                  value={formData.mocRequiredComment || ''} 
                  onChange={(e) => handleChange('mocRequiredComment', e.target.value)}
                  placeholder="Please explain why MOC is or is not required..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>

            {/* MOC Number - Show only if MOC is required */}
            {formData.mocRequired === 'Yes' && (
              <TextField 
                fullWidth 
                size="small"
                label="MOC Number" 
                value={formData.mocNumber || ''} 
                onChange={(e) => handleChange('mocNumber', e.target.value)}
                placeholder="Enter MOC number"
              />
            )}

            {/* Action Required */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Action Required?</FormLabel>
              <RadioGroup 
                row
                value={formData.actionRequired} 
                onChange={(e) => handleChange('actionRequired', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="None" control={<Radio size="small" />} label="None" />
                <FormControlLabel value="Monitor" control={<Radio size="small" />} label="Monitor" />
                <FormControlLabel value="Plan Work" control={<Radio size="small" />} label="Plan Work" />
                <FormControlLabel value="Urgent" control={<Radio size="small" />} label="Urgent" />
              </RadioGroup>
              {/* Comment field for Action Required - Show ONLY if not N/A AND not None */}
              {formData.actionRequired && formData.actionRequired !== 'N/A' && formData.actionRequired !== 'None' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`Action Comment (${formData.actionRequired})`}
                  value={formData.actionRequiredComment || ''} 
                  onChange={(e) => handleChange('actionRequiredComment', e.target.value)}
                  placeholder="Please explain the action required and timeline..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>
          </Box>
        </Grid>

        {/* Column 2 - WMS Manual Risk Assessment */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
              WMS Manual Risk Assessment
            </Typography>
            
            {/* Corrosion Risk */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Corrosion Risk</FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Risk of metal degradation due to isolation
              </Typography>
              <RadioGroup 
                row
                value={formData.corrosionRisk} 
                onChange={(e) => handleChange('corrosionRisk', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
              </RadioGroup>
              {/* Comment field for Corrosion Risk - Show if not N/A */}
              {formData.corrosionRisk && formData.corrosionRisk !== 'N/A' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`Corrosion Risk Comment (${formData.corrosionRisk})`}
                  value={formData.corrosionRiskComment || ''} 
                  onChange={(e) => handleChange('corrosionRiskComment', e.target.value)}
                  placeholder="Please explain the corrosion risk assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>

            {/* Dead Legs Risk */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Dead Legs Risk</FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Risk from stagnant fluid in isolated sections
              </Typography>
              <RadioGroup 
                row
                value={formData.deadLegsRisk} 
                onChange={(e) => handleChange('deadLegsRisk', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
              </RadioGroup>
              {/* Comment field for Dead Legs Risk - Show if not N/A */}
              {formData.deadLegsRisk && formData.deadLegsRisk !== 'N/A' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`Dead Legs Risk Comment (${formData.deadLegsRisk})`}
                  value={formData.deadLegsRiskComment || ''} 
                  onChange={(e) => handleChange('deadLegsRiskComment', e.target.value)}
                  placeholder="Please explain the dead legs risk assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>

            {/* Automation Loss Risk */}
            <FormControl component="fieldset" size="small">
              <FormLabel sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Automation Loss Risk</FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Risk from loss of control systems, alarms, or safety interlocks
              </Typography>
              <RadioGroup 
                row
                value={formData.automationLossRisk} 
                onChange={(e) => handleChange('automationLossRisk', e.target.value)}
              >
                <FormControlLabel value="N/A" control={<Radio size="small" />} label="N/A" />
                <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                <FormControlLabel value="Medium" control={<Radio size="small" />} label="Medium" />
                <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
              </RadioGroup>
              {/* Comment field for Automation Loss Risk - Show if not N/A */}
              {formData.automationLossRisk && formData.automationLossRisk !== 'N/A' && (
                <TextField 
                  fullWidth 
                  size="small"
                  label={`Automation Loss Risk Comment (${formData.automationLossRisk})`}
                  value={formData.automationLossRiskComment || ''} 
                  onChange={(e) => handleChange('automationLossRiskComment', e.target.value)}
                  placeholder="Please explain the automation loss risk assessment..."
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </FormControl>
          </Box>
        </Grid>
      </Grid>

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
