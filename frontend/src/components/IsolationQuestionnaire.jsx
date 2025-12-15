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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { calculateLTIAge } from '../utils/dateUtils';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReportIcon from '@mui/icons-material/Report';
import BusinessIcon from '@mui/icons-material/Business';

function IsolationQuestionnaire({ isolation, onDataChange }) {
  // Default form state
  const defaultFormData = {
    // Core Fields (Always visible)
    riskLevel: 'N/A',
    mocRequired: 'N/A',
    actionRequired: 'N/A',
    comments: '',

    // MOC Details
    mocNumber: '',
    mocStatus: 'N/A',

    // Parts & Equipment
    partsRequired: 'N/A',
    partsStatus: 'Not Assessed',
    partsExpectedDate: '',
    equipmentDisconnectionRequired: 'N/A',

    // Timeline
    plannedResolutionDate: '',
    priorityLevel: 'N/A',

    // WMS Manual Risks
    corrosionRisk: 'N/A',
    deadLegsRisk: 'N/A',
    automationLossRisk: 'N/A',

    // Asset Manager Review
    assetManagerReviewRequired: 'N/A',
    resolutionStrategy: 'N/A',

    // Action Items
    actionItems: []
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Get LTI age
  const plannedStartDate = isolation?.['Planned Start Date'] || isolation?.plannedStartDate;
  const ltiAgeInfo = calculateLTIAge(plannedStartDate);
  const ltiAge = ltiAgeInfo.display;
  const isSixMonthsPlus = ltiAgeInfo.isSixMonthsPlus;

  // Reset and load data when isolation changes
  useEffect(() => {
    // First reset to defaults
    setFormData(defaultFormData);

    // Then load any existing saved data for this isolation
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};
    const existingData = savedResponses[isolation?.id];

    if (existingData) {
      setFormData(prev => ({
        ...prev,
        ...existingData
      }));
    }
  }, [isolation?.id]);

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
      default: return 'default';
    }
  };

  const addActionItem = () => {
    handleChange('actionItems', [...formData.actionItems, { description: '', owner: '' }]);
  };

  const removeActionItem = (index) => {
    handleChange('actionItems', formData.actionItems.filter((_, i) => i !== index));
  };

  const handleActionItemChange = (index, field, value) => {
    const newItems = [...formData.actionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    handleChange('actionItems', newItems);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {isolation.id}
        </Typography>
        {ltiAge !== 'Unknown' && (
          <Chip
            label={`Age: ${ltiAge}`}
            color={isSixMonthsPlus ? 'warning' : 'default'}
            size="small"
          />
        )}
        {formData.riskLevel !== 'N/A' && (
          <Chip label={formData.riskLevel} color={getRiskColor(formData.riskLevel)} size="small" />
        )}
      </Box>

      {isolation.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isolation.description}
        </Typography>
      )}

      {/* 6-Month Alert */}
      {isSixMonthsPlus && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>6+ Months:</strong> Asset Manager review required per WMS Manual.
        </Alert>
      )}

      {/* === CORE QUESTIONS (Always Visible) === */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Risk Level */}
        <Grid item xs={12} sm={4}>
          <FormControl component="fieldset" size="small" fullWidth>
            <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Risk Level *</FormLabel>
            <RadioGroup
              row
              value={formData.riskLevel}
              onChange={(e) => handleChange('riskLevel', e.target.value)}
            >
              <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
              <FormControlLabel value="Medium" control={<Radio size="small" />} label="Med" />
              <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
              <FormControlLabel value="Critical" control={<Radio size="small" />} label="Crit" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* MOC Required */}
        <Grid item xs={12} sm={4}>
          <FormControl component="fieldset" size="small" fullWidth>
            <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>MOC Required? *</FormLabel>
            <RadioGroup
              row
              value={formData.mocRequired}
              onChange={(e) => handleChange('mocRequired', e.target.value)}
            >
              <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
              <FormControlLabel value="Under Review" control={<Radio size="small" />} label="Review" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Action Required */}
        <Grid item xs={12} sm={4}>
          <FormControl component="fieldset" size="small" fullWidth>
            <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Action Required? *</FormLabel>
            <RadioGroup
              row
              value={formData.actionRequired}
              onChange={(e) => handleChange('actionRequired', e.target.value)}
            >
              <FormControlLabel value="None" control={<Radio size="small" />} label="None" />
              <FormControlLabel value="Monitor" control={<Radio size="small" />} label="Monitor" />
              <FormControlLabel value="Plan Work" control={<Radio size="small" />} label="Plan" />
              <FormControlLabel value="Urgent" control={<Radio size="small" />} label="Urgent" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Comments */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Comments & Notes"
            value={formData.comments}
            onChange={(e) => handleChange('comments', e.target.value)}
            placeholder="Key observations, concerns, recommendations..."
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      {/* === EXPANDABLE SECTIONS === */}

      {/* MOC Details (show if MOC required) */}
      {formData.mocRequired === 'Yes' && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, fontSize: 18 }} /> MOC Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth size="small"
                label="MOC Number"
                value={formData.mocNumber}
                onChange={(e) => handleChange('mocNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
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
          </Grid>
        </Paper>
      )}

      {/* Parts & Equipment Details */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <BuildIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography>Parts & Equipment</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Parts Required?</FormLabel>
                <RadioGroup
                  row
                  value={formData.partsRequired}
                  onChange={(e) => handleChange('partsRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            {formData.partsRequired === 'Yes' && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Parts Status</InputLabel>
                    <Select
                      value={formData.partsStatus}
                      onChange={(e) => handleChange('partsStatus', e.target.value)}
                      label="Parts Status"
                    >
                      <MenuItem value="Not Ordered">Not Ordered</MenuItem>
                      <MenuItem value="Ordered">Ordered</MenuItem>
                      <MenuItem value="In Transit">In Transit</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" type="date"
                    label="Expected Arrival"
                    value={formData.partsExpectedDate}
                    onChange={(e) => handleChange('partsExpectedDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Equipment Disconnection Required?</FormLabel>
                <RadioGroup
                  row
                  value={formData.equipmentDisconnectionRequired}
                  onChange={(e) => handleChange('equipmentDisconnectionRequired', e.target.value)}
                >
                  <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                  <FormControlLabel value="Partially" control={<Radio size="small" />} label="Partial" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Timeline */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography>Timeline & Priority</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" type="date"
                label="Planned Resolution Date"
                value={formData.plannedResolutionDate}
                onChange={(e) => handleChange('plannedResolutionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* WMS Manual Risks */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SecurityIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography>WMS Manual Risks</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Corrosion Risk</FormLabel>
                <RadioGroup
                  row
                  value={formData.corrosionRisk}
                  onChange={(e) => handleChange('corrosionRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Med" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Dead Legs Risk</FormLabel>
                <RadioGroup
                  row
                  value={formData.deadLegsRisk}
                  onChange={(e) => handleChange('deadLegsRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Med" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Automation Loss Risk</FormLabel>
                <RadioGroup
                  row
                  value={formData.automationLossRisk}
                  onChange={(e) => handleChange('automationLossRisk', e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio size="small" />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio size="small" />} label="Med" />
                  <FormControlLabel value="High" control={<Radio size="small" />} label="High" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Asset Manager Review (only for 6+ month LTIs) */}
      {isSixMonthsPlus && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, color: 'warning.main' }} />
            Asset Manager Review
            <Chip label="6+ MONTHS" color="warning" size="small" sx={{ ml: 1 }} />
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Review Status</FormLabel>
                <RadioGroup
                  row
                  value={formData.assetManagerReviewRequired}
                  onChange={(e) => handleChange('assetManagerReviewRequired', e.target.value)}
                >
                  <FormControlLabel value="Required" control={<Radio size="small" />} label="Required" />
                  <FormControlLabel value="Scheduled" control={<Radio size="small" />} label="Scheduled" />
                  <FormControlLabel value="Completed" control={<Radio size="small" />} label="Completed" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" size="small">
                <FormLabel>Resolution Strategy</FormLabel>
                <RadioGroup
                  row
                  value={formData.resolutionStrategy}
                  onChange={(e) => handleChange('resolutionStrategy', e.target.value)}
                >
                  <FormControlLabel value="Prioritize Resolution" control={<Radio size="small" />} label="Prioritize" />
                  <FormControlLabel value="Risk Mitigation" control={<Radio size="small" />} label="Mitigate" />
                  <FormControlLabel value="Disconnection via MOC" control={<Radio size="small" />} label="Disconnect" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Warning Alerts */}
      {formData.riskLevel === 'Critical' && (
        <Alert severity="error" sx={{ mb: 1 }}>
          <strong>Critical Risk:</strong> Immediate attention required.
        </Alert>
      )}
      {formData.actionRequired === 'Urgent' && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          <strong>Urgent Action:</strong> Schedule work immediately.
        </Alert>
      )}

      {/* Action Items */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ReportIcon sx={{ mr: 1, color: 'secondary.main' }} />
          <Typography>Action Items ({formData.actionItems.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {formData.actionItems.map((item, index) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Action"
                value={item.description || ''}
                onChange={(e) => handleActionItemChange(index, 'description', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                size="small"
                label="Owner"
                value={item.owner || ''}
                onChange={(e) => handleActionItemChange(index, 'owner', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton onClick={() => removeActionItem(index)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addActionItem} size="small">
            Add Action
          </Button>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

IsolationQuestionnaire.propTypes = {
  isolation: PropTypes.shape({
    id: PropTypes.string,
    description: PropTypes.string,
    Title: PropTypes.string,
    'Planned Start Date': PropTypes.string,
    plannedStartDate: PropTypes.string
  }),
  onDataChange: PropTypes.func.isRequired
};

IsolationQuestionnaire.defaultProps = {
  isolation: null
};

export default IsolationQuestionnaire;
