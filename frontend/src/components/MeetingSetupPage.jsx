import { useEffect, useState } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Container,
  Paper,
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAppContext } from '../context/AppContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function MeetingSetupPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');
  const [added, setAdded] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [uploaded, setUploaded] = useState(false);
  const [newData, setNewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDetails, setShowDetails] = useState(false);
  const [attendeeDialog, setAttendeeDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const { currentMeeting, setCurrentMeeting, people, setPeople } = useAppContext();
  
  // Get master isolations from localStorage
  const [masterIsolations, setMasterIsolations] = useState(() => {
    return JSON.parse(localStorage.getItem('masterIsolations')) || [];
  });

  useEffect(() => {
    if (!currentMeeting) navigate('/');
  }, [currentMeeting, navigate]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        if (wb.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }
        
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        let uploadedData = XLSX.utils.sheet_to_json(ws);
        
        if (uploadedData.length === 0) {
          throw new Error('No data found in the Excel file');
        }
        
        // Check if the data has the required 'id' or 'ID' field
        const hasLowercaseId = uploadedData[0].hasOwnProperty('id');
        const hasUppercaseId = uploadedData[0].hasOwnProperty('ID');
        
        if (!hasLowercaseId && !hasUppercaseId) {
          throw new Error('Excel file must contain an "ID" column');
        }
        
        // Function to convert Excel date serial number to proper date string
        const convertExcelDate = (value) => {
          if (typeof value === 'number' && value > 25000 && value < 50000) {
            // Excel date serial number (days since 1900-01-01, with leap year bug)
            const excelEpoch = new Date(1900, 0, 1);
            const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
          }
          if (value instanceof Date) {
            return value.toISOString().split('T')[0]; // Return YYYY-MM-DD format
          }
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            return value.split('T')[0]; // Already in correct format, just remove time part
          }
          return value; // Return as-is if not a recognizable date format
        };
        
        // Transform the data to handle ID field and date conversion
        uploadedData = uploadedData.map(item => {
          const newItem = { ...item };
          
          // Handle ID field
          if (hasUppercaseId && !hasLowercaseId) {
            newItem.id = item.ID;
          }
          
          // Handle Planned Start Date conversion
          const plannedDateFields = ['Planned Start Date', 'plannedStartDate', 'PlannedStartDate'];
          plannedDateFields.forEach(field => {
            if (newItem[field] !== undefined) {
              newItem[field] = convertExcelDate(newItem[field]);
            }
          });
          
          return newItem;
        });
        
        setNewData(uploadedData);

        // Compare with master list
        const previousIds = new Set(masterIsolations.map(item => item.id));
        const newIds = new Set(uploadedData.map(item => item.id));

        const addedItems = uploadedData.filter(item => !previousIds.has(item.id));
        const removedItems = masterIsolations.filter(item => !newIds.has(item.id));

        setAdded(addedItems);
        setRemoved(removedItems);
        setUploaded(true);

        // Store in localStorage
        localStorage.setItem('addedIsolations', JSON.stringify(addedItems));
        localStorage.setItem('removedIsolations', JSON.stringify(removedItems));
        localStorage.setItem('currentMeetingIsolations', JSON.stringify(uploadedData));
        
        setSnackbar({
          open: true,
          message: `File processed successfully. Found ${addedItems.length} new items and ${removedItems.length} removed items.`,
          severity: 'success'
        });
      } catch (err) {
        console.error('Error processing Excel file:', err);
        setError(err.message || 'Error processing Excel file');
        setSnackbar({
          open: true,
          message: err.message || 'Error processing Excel file',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error reading file',
        severity: 'error'
      });
    };
    
    reader.readAsBinaryString(file);
  };

  const handleContinue = () => {
    // First update the master list
    if (newData.length > 0) {
      localStorage.setItem('masterIsolations', JSON.stringify(newData));
      setMasterIsolations(newData);
      
      // Also update the LTI Master List
      localStorage.setItem('ltiMasterList', JSON.stringify(newData));
      
      setSnackbar({
        open: true,
        message: 'Master List updated. Starting review process...',
        severity: 'success'
      });
      
      // Set all items as needing review
      const itemsNeedingReview = newData.map(item => ({
        ...item,
        needsUpdate: true,
        lastReviewed: null // Clear last review date to force review
      }));
      
      // Save to localStorage for the review page
      localStorage.setItem('currentMeetingIsolations', JSON.stringify(itemsNeedingReview));
      
      // Navigate to review page after a short delay to show the message
      setTimeout(() => {
        navigate('/review');
      }, 1500);
    } else {
      setSnackbar({
        open: true,
        message: 'No data to review',
        severity: 'warning'
      });
    }
  };

  const handleFinalize = () => {
    if (newData.length > 0) {
      setConfirmDialog(true);
    } else {
      setSnackbar({
        open: true,
        message: 'No data to update',
        severity: 'warning'
      });
    }
  };
  
  const confirmFinalize = () => {
    if (newData.length > 0) {
      localStorage.setItem('masterIsolations', JSON.stringify(newData));
      setMasterIsolations(newData);
      setConfirmDialog(false);
      setSnackbar({
        open: true,
        message: 'Master Isolation List has been updated successfully!',
        severity: 'success'
      });
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleAddExistingPerson = () => {
    if (!selectedPerson) return;
    
    if (currentMeeting.attendees.includes(selectedPerson)) {
      setSnackbar({ open: true, message: 'This person is already added as an attendee', severity: 'warning' });
      return;
    }
    
    const updatedMeeting = { 
      ...currentMeeting, 
      attendees: [...currentMeeting.attendees, selectedPerson] 
    };
    setCurrentMeeting(updatedMeeting);
    setSelectedPerson('');
    setSnackbar({ open: true, message: 'Attendee added successfully', severity: 'success' });
  };
  
  const handleAddNewPerson = () => {
    if (!newPersonName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    
    const trimmedName = newPersonName.trim();
    
    if (people.includes(trimmedName)) {
      setSnackbar({ open: true, message: 'This person already exists in the people list', severity: 'error' });
      return;
    }
    
    if (currentMeeting.attendees.includes(trimmedName)) {
      setSnackbar({ open: true, message: 'This person is already added as an attendee', severity: 'warning' });
      return;
    }
    
    // Add to global people list
    const updatedPeople = [...people, trimmedName];
    setPeople(updatedPeople);
    
    // Store people list for future meetings
    localStorage.setItem('meetingPeople', JSON.stringify(updatedPeople));
    localStorage.setItem('savedPeople', JSON.stringify(updatedPeople));
    
    // Add to meeting attendees
    const updatedMeeting = { 
      ...currentMeeting, 
      attendees: [...currentMeeting.attendees, trimmedName] 
    };
    setCurrentMeeting(updatedMeeting);
    
    // Reset form and close dialog
    setNewPersonName('');
    setAttendeeDialog(false);
    
    setSnackbar({ open: true, message: 'New person added successfully', severity: 'success' });
  };

  // Enhanced columns with better formatting
  const columns = newData.length > 0 ? Object.keys(newData[0]).map((field) => ({
    field,
    headerName: field.charAt(0).toUpperCase() + field.slice(1), // Capitalize first letter
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      // Check if this is a new item
      const isNewItem = added.some(item => item.id === params.row.id);
      if (isNewItem && field === 'id') {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label="NEW" 
              size="small" 
              color="success" 
              sx={{ mr: 1 }} 
            />
            {params.value}
          </Box>
        );
      }
      return params.value;
    }
  })) : [];

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/home')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Upload Isolation List</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box textAlign="center">
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Meeting Information</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography><strong>Date:</strong> {currentMeeting?.date}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography><strong>Attendees:</strong></Typography>
                  <Button 
                    variant="text" 
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAttendeeDialog(true)}
                    sx={{ ml: 2 }}
                  >
                    Add Attendee
                  </Button>
                </Box>
                <Box sx={{ mt: 1, ml: 2 }}>
                  {currentMeeting?.attendees?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No attendees added yet
                    </Typography>
                  ) : (
                    currentMeeting?.attendees?.map((attendee, index) => (
                      <Chip 
                        key={index}
                        label={attendee}
                        sx={{ mr: 1, mb: 1 }}
                        onDelete={() => {
                          const updatedMeeting = { 
                            ...currentMeeting, 
                            attendees: currentMeeting.attendees.filter((_, i) => i !== index) 
                          };
                          setCurrentMeeting(updatedMeeting);
                        }}
                      />
                    ))
                  )}
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/home')}
              >
                Edit Meeting Details
              </Button>
            </Box>
          </Box>

          {!uploaded && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Upload Excel File with Isolation List</Typography>
              <Typography color="textSecondary" sx={{ mb: 3 }}>
                File should contain an "ID" column to identify isolations
              </Typography>
              <Button 
                variant="contained" 
                component="label" 
                size="large"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Select Excel File'}
                <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
              </Button>
              
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography>Processing file...</Typography>
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 3, width: '100%', maxWidth: 500 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}

          {fileName && !loading && (
            <Typography sx={{ mt: 2 }}>
              <strong>Uploaded File:</strong> {fileName}
            </Typography>
          )}

          {uploaded && (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                LTI Master List
              </Typography>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                  <Tab label={`All Items (${newData.length})`} />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={added.length} 
                          size="small" 
                          color="success" 
                          sx={{ mr: 1 }} 
                        />
                        New Items
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={removed.length} 
                          size="small" 
                          color="error" 
                          sx={{ mr: 1 }} 
                        />
                        Removed Items
                      </Box>
                    } 
                  />
                </Tabs>
              </Box>

              {tabValue === 0 && (
                <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={showDetails} 
                          onChange={(e) => setShowDetails(e.target.checked)} 
                        />
                      }
                      label="Highlight Changes"
                    />
                    <Tooltip title="Items with green highlight are new additions">
                      <IconButton>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {newData.length > 0 && columns.length > 0 && (
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }} aria-label="isolation data table">
                        <TableHead>
                          <TableRow>
                            {columns.map((column) => (
                              <TableCell key={column.field}>{column.headerName}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {newData.slice(0, 10).map((row) => (
                            <TableRow
                              key={row.id}
                              sx={{ 
                                '&:last-child td, &:last-child th': { border: 0 },
                                ...(showDetails && added.some(item => item.id === row.id) ? 
                                  { backgroundColor: 'rgba(46, 125, 50, 0.1)' } : {})
                              }}
                            >
                              {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.field}`}>
                                  {column.field === 'id' && added.some(item => item.id === row.id) ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Chip 
                                        label="NEW" 
                                        size="small" 
                                        color="success" 
                                        sx={{ mr: 1 }} 
                                      />
                                      {row[column.field]}
                                    </Box>
                                  ) : (
                                    row[column.field]
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tabValue === 1 && (
                <Box mt={3}>
                  {added.length === 0 ? (
                    <Alert severity="info">No new items in this upload.</Alert>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom>
                        New Items Added: {added.length}
                      </Typography>
                      <List sx={{ bgcolor: '#f9f9f9', borderRadius: 1, mt: 2 }}>
                        {added.map((item, idx) => (
                          <ListItem key={idx} sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', mb: 1, borderRadius: 1 }}>
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
                    </>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Box mt={3}>
                  {removed.length === 0 ? (
                    <Alert severity="info">No items were removed in this upload.</Alert>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Items Removed: {removed.length}
                      </Typography>
                      <List sx={{ bgcolor: '#f9f9f9', borderRadius: 1, mt: 2 }}>
                        {removed.map((item, idx) => (
                          <ListItem key={idx} sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', mb: 1, borderRadius: 1 }}>
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
                    </>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large"
                  onClick={handleContinue}
                >
                  Update Master List & Continue to Review
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Update Master Isolation List?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will update the master isolation list with the current data.
            {added.length > 0 && ` ${added.length} new items will be added.`}
            {removed.length > 0 && ` ${removed.length} items will be removed.`}
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmFinalize} variant="contained" color="primary">
            Update Master List
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Attendee Dialog */}
      <Dialog
        open={attendeeDialog}
        onClose={() => setAttendeeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Attendee</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select from existing people:
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <FormControl fullWidth sx={{ mr: 2 }}>
                <InputLabel id="select-person-label">Select Person</InputLabel>
                <Select
                  labelId="select-person-label"
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  label="Select Person"
                >
                  <MenuItem value="">
                    <em>Select a person</em>
                  </MenuItem>
                  {people.map((person, index) => (
                    <MenuItem key={index} value={person}>
                      {person}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                onClick={handleAddExistingPerson}
                disabled={!selectedPerson}
                sx={{ minWidth: '120px' }}
              >
                Add
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Or add a new person:
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <TextField
                fullWidth
                label="New Person Name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                sx={{ mr: 2 }}
              />
              
              <Button 
                variant="contained" 
                onClick={handleAddNewPerson}
                disabled={!newPersonName.trim()}
                sx={{ minWidth: '120px' }}
              >
                Add New
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendeeDialog(false)}>Close</Button>
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

export default MeetingSetupPage;
