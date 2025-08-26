import { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Container,
  Paper,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Grid,
  Chip,
  Switch,
  Tooltip,
  FormControlLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import IsolationQuestionnaire from './IsolationQuestionnaire';

function ReviewPage() {
  const navigate = useNavigate();
  const { currentMeeting } = useAppContext();
  const [isolations, setIsolations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [saveExitDialog, setSaveExitDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saveProgress, setSaveProgress] = useState(false);

  // Function to check for related isolations based ONLY on the first 3 digits after CAHE-
  const checkForRelatedIsolations = (isolations, currentIsolation) => {
    const currentEquipmentString = currentIsolation?.systemEquipment || currentIsolation?.['System/Equipment']; // Check both properties
    if (!currentIsolation || !currentEquipmentString) {
      return [];
    }
    
    // Extract the first 3 digits after CAHE- from the current isolation
    const currentMatch = currentEquipmentString.match(/CAHE[-]?(\d{3})/i);
    if (!currentMatch || !currentMatch[1]) {
      return [];
    }
    const currentPrefix = currentMatch[1];
    
    // Find other isolations with the same first 3 digits
    const related = isolations.filter(isolation => {
      if (isolation.id === currentIsolation.id) return false;
      const equipmentString = isolation.systemEquipment || isolation['System/Equipment']; // Check both properties
      if (!equipmentString) return false;
      
      const isolationMatch = equipmentString.match(/CAHE[-]?(\d{3})/i);
      if (!isolationMatch || !isolationMatch[1]) return false;
      
      const isolationPrefix = isolationMatch[1];
      
      // Return true if the first 3 digits match
      return isolationPrefix === currentPrefix;
    });
    return related;
  };

  useEffect(() => {
    // Load isolations from localStorage
    const data = JSON.parse(localStorage.getItem('currentMeetingIsolations')) || [];
    if (data.length === 0) navigate('/setup');
    setIsolations(data);
    
    // Load any saved responses from current meeting
    const savedResponses = JSON.parse(localStorage.getItem('currentMeetingResponses')) || {};
    setResponses(savedResponses);
    
    // If there are saved responses, ask if the user wants to continue from where they left off
    if (Object.keys(savedResponses).length > 0) {
      // Find the last isolation that has a response
      const lastRespondedIndex = data.findIndex(isolation => 
        !savedResponses[isolation.id] || !isIsolationComplete(savedResponses[isolation.id])
      );
      
      if (lastRespondedIndex !== -1) {
        setCurrentIndex(lastRespondedIndex);
      }
    }
  }, [navigate]);
  
  // State to store related isolations (based on 3-digit prefix)
  const [relatedIsolations, setRelatedIsolations] = useState([]);
  
  // Check for related isolations when current isolation changes
  useEffect(() => {
    if (currentIsolation) {
      const related = checkForRelatedIsolations(isolations, currentIsolation);
      setRelatedIsolations(related);
    }
  }, [currentIndex, isolations]);
  
  // Check if an isolation response is complete - Updated for streamlined questionnaire
  const isIsolationComplete = (response) => {
    if (!response) return false;
    
    // Essential fields for streamlined questionnaire
    // Overall Risk Level (required)
    if (!response.riskLevel || response.riskLevel === 'N/A') return false;
    
    // MOC Required (required)
    if (!response.mocRequired || response.mocRequired === 'N/A') return false;
    
    // If MOC is required, check if MOC number is provided
    if (response.mocRequired === 'Yes' && !response.mocNumber) return false;
    
    // Action Required (required)
    if (!response.actionRequired || response.actionRequired === 'N/A') return false;
    
    // WMS Manual Risk Assessment (required for compliance)
    if (!response.corrosionRisk || response.corrosionRisk === 'N/A') return false;
    if (!response.deadLegsRisk || response.deadLegsRisk === 'N/A') return false;
    if (!response.automationLossRisk || response.automationLossRisk === 'N/A') return false;
    
    // For LTIs over 6 months, Asset Manager Review fields are required
    const ltiAge = calculateLTIAge(isolations[currentIndex]?.['Planned Start Date'] || isolations[currentIndex]?.plannedStartDate || isolations[currentIndex]?.PlannedStartDate);
    if ((ltiAge.includes('month') && parseInt(ltiAge) >= 6) || ltiAge.includes('year')) {
      if (!response.assetManagerReviewRequired || response.assetManagerReviewRequired === 'N/A') return false;
      if (!response.resolutionStrategy || response.resolutionStrategy === 'N/A') return false;
    }
    
    return true;
  };

  // Calculate LTI age helper function (moved up for use in validation)
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
  
  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (isolations.length === 0) return 0;
    
    const completedCount = isolations.filter(isolation => 
      responses[isolation.id] && isIsolationComplete(responses[isolation.id])
    ).length;
    
    return Math.round((completedCount / isolations.length) * 100);
  };

  const currentIsolation = isolations[currentIndex];

  const handleChange = (field, value) => {
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setResponses(prev => ({
      ...prev,
      [currentIsolation.id]: {
        ...prev[currentIsolation.id],
        [field]: value,
      },
    }));
    
    // Save progress to localStorage
    if (saveProgress) {
      const updatedResponses = {
        ...responses,
        [currentIsolation.id]: {
          ...(responses[currentIsolation.id] || {}),
          [field]: value,
        },
      };
      localStorage.setItem('currentMeetingResponses', JSON.stringify(updatedResponses));
    }
  };

  const validateCurrentIsolation = () => {
    // For the streamlined questionnaire with N/A defaults, we don't need strict validation
    // since N/A is a valid answer for all fields. Just return true to allow progression.
    return true;
  };

  const previous = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setValidationErrors({});
      // Scroll to top of page when moving to previous LTI
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const next = () => {
    // Save current responses to localStorage
    localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
    
    if (currentIndex < isolations.length - 1) {
      // Validate current isolation before moving to next
      if (validateCurrentIsolation()) {
        setCurrentIndex(currentIndex + 1);
        setValidationErrors({});
        // Scroll to top of page when moving to next LTI
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSnackbar({
          open: true,
          message: 'Please complete all required fields before proceeding',
          severity: 'error'
        });
      }
    } else {
      // For streamlined questionnaire, allow finishing even with N/A defaults
      // since N/A is a valid answer for all fields
      setConfirmDialog(true);
    }
  };
  
  const finishReview = () => {
    localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
    setConfirmDialog(false);
    navigate('/summary');
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const toggleSaveProgress = () => {
    setSaveProgress(!saveProgress);
    if (!saveProgress) {
      // Save current progress when enabling auto-save
      localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
      setSnackbar({
        open: true,
        message: 'Auto-save enabled. Progress will be saved as you go.',
        severity: 'info'
      });
    }
  };

  const handleSaveAndExit = () => {
    setSaveExitDialog(true);
  };

  const confirmSaveAndExit = () => {
    // Save current progress
    localStorage.setItem('currentMeetingResponses', JSON.stringify(responses));
    
    // Save current position for resuming later
    localStorage.setItem('currentMeetingPosition', JSON.stringify({
      currentIndex,
      timestamp: new Date().toISOString(),
      totalIsolations: isolations.length,
      completedCount: Object.keys(responses).length
    }));
    
    setSaveExitDialog(false);
    setSnackbar({
      open: true,
      message: 'Progress saved successfully. You can resume the review later.',
      severity: 'success'
    });
    
    // Navigate back to home after a short delay
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (!currentIsolation) return null;

  const completionPercentage = getCompletionPercentage();

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 2, mt: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => navigate('/setup')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Review Isolations</Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={saveProgress} 
                  onChange={toggleSaveProgress} 
                />
              }
              label="Auto-save"
            />
            <Tooltip title="Save progress automatically as you review">
              <IconButton>
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Overall Progress</Typography>
            <Typography variant="body1">{completionPercentage}% Complete</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Isolation {currentIndex + 1} of {isolations.length}
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<NavigateBeforeIcon />} 
              onClick={previous}
              disabled={currentIndex === 0}
              sx={{ mr: 1 }}
            >
              Previous
            </Button>
            <Button 
              variant="contained" 
              endIcon={<NavigateNextIcon />} 
              onClick={next}
            >
              {currentIndex === isolations.length - 1 ? 'Finish Review' : 'Next'}
            </Button>
          </Box>
        </Box>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {currentIsolation.Title || `Isolation ID: ${currentIsolation.id}`}
              </Typography>
              
              {responses[currentIsolation.id] && isIsolationComplete(responses[currentIsolation.id]) ? (
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Complete" 
                  color="success" 
                  variant="outlined" 
                />
              ) : (
                <Chip 
                  icon={<ErrorIcon />} 
                  label="Incomplete" 
                  color="warning" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Related by prefix (first 3 digits) - Warning */}
            {relatedIsolations.length > 0 && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle2">
                  Warning: Related Isolations Detected
                </Typography>
                <Typography variant="body2">
                  This isolation shares the same system prefix (first 3 digits after CAHE-) with {relatedIsolations.length} other isolation(s). 
                  This may indicate related equipment and potential additional risks that need consideration.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {relatedIsolations.map(isolation => (
                    <Chip 
                      key={isolation.id}
                      label={isolation.Title || isolation.id}
                      size="small"
                      color="warning"
                      sx={{ mr: 1, mt: 1 }}
                    />
                  ))}
                </Box>
              </Alert>
            )}
            
            {/* Use the Enhanced Isolation Questionnaire Component */}
            <IsolationQuestionnaire
              isolation={currentIsolation}
              onDataChange={(isolationId, data) => {
                // Update state
                const updatedResponses = {
                  ...responses,
                  [isolationId]: data
                };
                setResponses(updatedResponses);
                
                // CRITICAL FIX: Immediately save to localStorage to ensure all data persists
                localStorage.setItem('currentMeetingResponses', JSON.stringify(updatedResponses));
                
                console.log('🔍 ReviewPage - Data saved for isolation:', isolationId);
                console.log('🔍 ReviewPage - Complete data object:', data);
                console.log('🔍 ReviewPage - Conditional comment fields:', {
                  riskLevelComment: data.riskLevelComment,
                  mocRequiredComment: data.mocRequiredComment,
                  actionRequiredComment: data.actionRequiredComment,
                  corrosionRiskComment: data.corrosionRiskComment,
                  deadLegsRiskComment: data.deadLegsRiskComment,
                  automationLossRiskComment: data.automationLossRiskComment
                });
              }}
            />
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            startIcon={<NavigateBeforeIcon />} 
            onClick={previous}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          <Box>
            <Tooltip title="Save progress and exit the review. You can resume later from where you left off.">
              <Button 
                variant="outlined"
                color="warning"
                startIcon={<ExitToAppIcon />}
                sx={{ mr: 2 }}
                onClick={handleSaveAndExit}
              >
                Save & Exit
              </Button>
            </Tooltip>
            
            <Button 
              variant="contained" 
              endIcon={<NavigateNextIcon />} 
              onClick={next}
              color={currentIndex === isolations.length - 1 ? "success" : "primary"}
            >
              {currentIndex === isolations.length - 1 ? 'Finish Review' : 'Next Isolation'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Finish Review?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have completed the review of all {isolations.length} isolations.
            Would you like to proceed to the meeting summary?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={finishReview} variant="contained" color="primary">
            Proceed to Summary
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save & Exit Dialog */}
      <Dialog
        open={saveExitDialog}
        onClose={() => setSaveExitDialog(false)}
      >
        <DialogTitle>Save Progress & Exit?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your progress will be saved and you can resume the review later from where you left off.
            <br /><br />
            <strong>Current Progress:</strong>
            <br />
            • Isolation {currentIndex + 1} of {isolations.length}
            <br />
            • {completionPercentage}% Complete
            <br />
            • {Object.keys(responses).length} isolations have responses
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveExitDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmSaveAndExit} 
            variant="contained" 
            color="warning"
            startIcon={<SaveIcon />}
          >
            Save & Exit
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

export default ReviewPage;
