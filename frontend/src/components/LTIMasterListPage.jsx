import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  IconButton, 
  Divider,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import * as XLSX from 'xlsx';

function LTIMasterListPage() {
  const navigate = useNavigate();
  const [ltiItems, setLtiItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNeedsUpdateOnly, setShowNeedsUpdateOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: 'LTI Master List Update', text: '' });
  const [emailStatus, setEmailStatus] = useState({ loading: false, success: false, error: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Progress tracking
  const [currentIsolationIndex, setCurrentIsolationIndex] = useState(0);
  const [reviewData, setReviewData] = useState({
    riskLevel: 'Medium',
    partsRequired: 'No',
    mocRequired: 'No',
    engineeringRequired: 'No',
    comments: ''
  });
  
  // Function to check for related isolations based ONLY on the first 3 digits after CAHE-
  const checkForRelatedIsolations = (items) => {
    // Create map to store CAHE prefixes and their occurrences
    const cahePrefixMap = {}; // For first 3 digits
    
    // Extract CAHE prefixes from systemEquipment or System/Equipment field
    items.forEach(item => {
      const equipmentString = item.systemEquipment || item['System/Equipment']; // Check both properties
      if (equipmentString) {
        // Match CAHE followed by optional hyphen, then capture the first 3 digits
        const match = equipmentString.match(/CAHE[-]?(\d{3})/i); 
        if (match && match[1]) {
          const cahePrefix = match[1];
          // Track by prefix (first 3 digits)
          if (!cahePrefixMap[cahePrefix]) {
            cahePrefixMap[cahePrefix] = [];
          }
          cahePrefixMap[cahePrefix].push(item.id);
        }
      } else {
        // console.log(`[LTIMasterList] Item ${item.id} - No equipment string found.`); // Optional: Log items without equipment string
      }
    });
    
    // Mark items with related isolations (same first 3 digits)
    const updatedItems = [...items];
    updatedItems.forEach(item => {
      item.hasRelatedIsolations = false; // Reset flag
      item.relatedIsolationIds = [];
      
      const equipmentString = item.systemEquipment || item['System/Equipment']; // Check both properties
      if (equipmentString) {
        const match = equipmentString.match(/CAHE[-]?(\d{3})/i);
        if (match && match[1]) {
          const cahePrefix = match[1];
          
          // Check if this prefix exists in the map and has more than one entry
          if (cahePrefixMap[cahePrefix] && cahePrefixMap[cahePrefix].length > 1) {
            item.hasRelatedIsolations = true;
            item.relatedIsolationIds = cahePrefixMap[cahePrefix].filter(id => id !== item.id);
            item.riskReason = "Related isolations on same system (same first 3 digits after CAHE-)";
          }
        }
      }
    });
    
    return updatedItems;
  };
  
  useEffect(() => {
    // Load LTI items from localStorage
    let savedItems = JSON.parse(localStorage.getItem('ltiMasterList')) || [];
    
    // If no items exist, create sample data
    if (savedItems.length === 0) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthDate = lastMonth.toISOString().split('T')[0];
      
      // Create dates for sample data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      savedItems = [
        {
          id: 'LTI-001',
          equipmentId: 'EQ-VALVE-101',
          systemEquipment: 'CAHE123-Valve',
          name: 'Main control valve isolation',
          description: 'Process line A main control valve locked out',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'Medium',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-123',
          partsRequired: 'Yes',
          partsList: 'Valve seat, actuator, gasket set',
          partsETA: '2025-05-15',
          mocNeeded: 'No',
          mocNumber: '',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'John Smith',
          engineeringResponseETA: '2025-04-30',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Replacement valve on order, scheduled for installation next month',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        {
          id: 'LTI-002',
          equipmentId: 'EQ-SENS-202',
          systemEquipment: 'CAHE123-Sensor',
          name: 'Pressure sensor bypass',
          description: 'Tank B pressure sensor bypassed',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'Low',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-124',
          partsRequired: 'Yes',
          partsList: 'Pressure transmitter, cable assembly',
          partsETA: '2025-04-30',
          mocNeeded: 'No',
          mocNumber: '',
          engineeringSupportNeeded: 'No',
          assignedEngineer: '',
          engineeringResponseETA: '',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Replacement sensor arrived, installation scheduled for next week',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        // Add an exact match for CAHE456 to demonstrate the exact match detection
        {
          id: 'LTI-006',
          equipmentId: 'EQ-PUMP-606',
          systemEquipment: 'CAHE456-Pump',
          name: 'Circulation pump isolation',
          description: 'Secondary circulation pump locked out',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'Medium',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-128',
          partsRequired: 'Yes',
          partsList: 'Pump seals, motor bearings',
          partsETA: '2025-05-20',
          mocNeeded: 'No',
          mocNumber: '',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'Robert Chen',
          engineeringResponseETA: '2025-05-05',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Pump requires full rebuild, parts on order',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        {
          id: 'LTI-003',
          equipmentId: 'EQ-FLOW-303',
          systemEquipment: 'CAHE456-FlowMeter',
          name: 'Flow meter isolation',
          description: 'Input line C flow meter isolated',
          status: 'Inactive',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'High',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-125',
          partsRequired: 'Yes',
          partsList: 'Flow meter assembly, mounting hardware',
          partsETA: 'Unknown',
          mocNeeded: 'Yes',
          mocNumber: 'MOC-2025-42',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'Sarah Johnson',
          engineeringResponseETA: '2025-05-10',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Awaiting specialized parts from vendor, engineering review in progress',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        {
          id: 'LTI-004',
          equipmentId: 'EQ-TEMP-404',
          systemEquipment: 'CAHE456-TempController',
          name: 'Temperature controller lockout',
          description: 'Heater D temperature controller locked out',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'Low',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-126',
          partsRequired: 'No',
          partsList: '',
          partsETA: '',
          mocNeeded: 'No',
          mocNumber: '',
          engineeringSupportNeeded: 'No',
          assignedEngineer: '',
          engineeringResponseETA: '',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Scheduled for maintenance during next shutdown',
          needsUpdate: false,
          hasRelatedIsolations: false
        },
        {
          id: 'LTI-005',
          equipmentId: 'EQ-LEVL-505',
          systemEquipment: 'CAHE789-LevelIndicator',
          name: 'Level indicator bypass',
          description: 'Storage tank E level indicator bypassed',
          status: 'Pending',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'Medium',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-127',
          partsRequired: 'Yes',
          partsList: 'Level transmitter, float assembly',
          partsETA: '2025-04-25',
          mocNeeded: 'Yes',
          mocNumber: 'MOC-2025-43',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'Michael Wong',
          engineeringResponseETA: '2025-04-22',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Parts arrived, installation scheduled for next week',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        // Add example with CAHE-XXX-XXXX format
        {
          id: 'LTI-007',
          equipmentId: 'EQ-PRES-707',
          systemEquipment: 'CAHE-813-4322',
          name: 'Pressure relief valve isolation',
          description: 'Main pressure relief valve isolated for maintenance',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'High',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-129',
          partsRequired: 'Yes',
          partsList: 'Valve seat, spring assembly, gaskets',
          partsETA: '2025-05-10',
          mocNeeded: 'Yes',
          mocNumber: 'MOC-2025-44',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'Lisa Johnson',
          engineeringResponseETA: '2025-04-28',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'Critical safety equipment, requires expedited repair',
          needsUpdate: true,
          hasRelatedIsolations: false
        },
        // Add another with same CAHE number to demonstrate exact match detection
        {
          id: 'LTI-008',
          equipmentId: 'EQ-PRES-808',
          systemEquipment: 'CAHE-813-4322',
          name: 'Secondary pressure valve isolation',
          description: 'Secondary pressure valve isolated for replacement',
          status: 'Active',
          isolationStartDate: sixMonthsAgo.toISOString().split('T')[0],
          riskLevel: 'High',
          workOrderRequired: 'Yes',
          workOrderNumber: 'WO-2025-130',
          partsRequired: 'Yes',
          partsList: 'Complete valve assembly',
          partsETA: '2025-05-15',
          mocNeeded: 'Yes',
          mocNumber: 'MOC-2025-45',
          engineeringSupportNeeded: 'Yes',
          assignedEngineer: 'Lisa Johnson',
          engineeringResponseETA: '2025-04-28',
          lastReviewed: lastMonthDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          additionalComments: 'HIGH RISK: Multiple isolations on same equipment',
          needsUpdate: true,
          hasRelatedIsolations: false
        }
      ];
      
      // Save sample data to localStorage
      localStorage.setItem('ltiMasterList', JSON.stringify(savedItems));
    }
    
    // Check for related isolations based on CAHE pattern
    const itemsWithRelatedIsolations = checkForRelatedIsolations(savedItems);
    
    setLtiItems(itemsWithRelatedIsolations);
    setFilteredItems(itemsWithRelatedIsolations);
  }, []);
  
  useEffect(() => {
    // Apply filters
    let filtered = [...ltiItems];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Filter by needs update
    if (showNeedsUpdateOnly) {
      filtered = filtered.filter(item => item.needsUpdate);
    }
    
    setFilteredItems(filtered);
    setPage(0); // Reset to first page when filters change
  }, [searchTerm, showNeedsUpdateOnly, ltiItems]);
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleAddItem = () => {
    setSelectedItem({
      id: Date.now().toString(), // Generate a unique ID
      name: '',
      description: '',
      status: 'Active',
      category: '',
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };
  
  const handleEditItem = (item) => {
    setSelectedItem({...item});
    setOpenDialog(true);
  };
  
  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    const updatedItems = ltiItems.filter(item => item.id !== selectedItem.id);
    setLtiItems(updatedItems);
    localStorage.setItem('ltiMasterList', JSON.stringify(updatedItems));
    setDeleteDialog(false);
    setSnackbar({
      open: true,
      message: 'Item deleted successfully',
      severity: 'success'
    });
  };
  
  const handleSaveItem = () => {
    // Validate form
    if (!selectedItem.name || !selectedItem.category) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    let updatedItems;
    const existingIndex = ltiItems.findIndex(item => item.id === selectedItem.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      updatedItems = [...ltiItems];
      updatedItems[existingIndex] = {
        ...selectedItem,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    } else {
      // Add new item
      updatedItems = [...ltiItems, {
        ...selectedItem,
        lastUpdated: new Date().toISOString().split('T')[0]
      }];
    }
    
    setLtiItems(updatedItems);
    localStorage.setItem('ltiMasterList', JSON.stringify(updatedItems));
    setOpenDialog(false);
    setSnackbar({
      open: true,
      message: existingIndex >= 0 ? 'Item updated successfully' : 'Item added successfully',
      severity: 'success'
    });
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const uploadedData = XLSX.utils.sheet_to_json(ws);
        
        if (uploadedData.length === 0) {
          throw new Error('No data found in the Excel file');
        }
        
        // Get current master list
        const currentMasterList = [...ltiItems];
        
        // Create a map of current items by ID for easy lookup
        const currentItemsMap = {};
        currentMasterList.forEach(item => {
          currentItemsMap[item.id] = item;
        });
        
        // Create a map of uploaded items by ID
        const uploadedItemsMap = {};
        uploadedData.forEach(item => {
          if (item.id) {
            uploadedItemsMap[item.id] = item;
          }
        });
        
        // Identify new items (in uploaded file but not in current master list)
        const newItems = uploadedData.filter(item => item.id && !currentItemsMap[item.id]);
        
        // Identify removed items (in current master list but not in uploaded file)
        const removedItems = currentMasterList.filter(item => !uploadedItemsMap[item.id]);
        
        // Identify updated items (in both lists but with changes)
        const updatedItems = uploadedData.filter(item => 
          item.id && currentItemsMap[item.id] && JSON.stringify(item) !== JSON.stringify(currentItemsMap[item.id])
        );
        
        // Process the uploaded data, ensuring correct property names
        const processedData = uploadedData.map(item => {
          const newItem = { ...item }; // Copy item
          
          // Map 'System/Equipment' from Excel to 'systemEquipment'
          if (newItem['System/Equipment'] && !newItem.systemEquipment) {
            newItem.systemEquipment = newItem['System/Equipment'];
            // delete newItem['System/Equipment']; // Optional: remove the original property
          }
          
          // Ensure required fields exist or have defaults
          newItem.id = newItem.id || `LTI-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          newItem.lastUpdated = new Date().toISOString().split('T')[0];
          
          // Ensure systemEquipment is defined, even if empty, for consistency
          if (newItem.systemEquipment === undefined) {
             newItem.systemEquipment = ''; 
          }

          return newItem;
        });
        
        // Update the master list
        setLtiItems(processedData);
        localStorage.setItem('ltiMasterList', JSON.stringify(processedData));
        
        // Show summary of changes
        setSnackbar({
          open: true,
          message: `Import successful: ${newItems.length} new items, ${removedItems.length} removed items, ${updatedItems.length} updated items`,
          severity: 'success'
        });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Error processing Excel file',
          severity: 'error'
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };
  
  const exportToExcel = () => {
    if (ltiItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning'
      });
      return;
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(ltiItems);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LTI Master List');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'LTI_Master_List.xlsx');
    
    setSnackbar({
      open: true,
      message: 'Excel file downloaded successfully!',
      severity: 'success'
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Send email notification
  const sendEmail = async () => {
    if (!emailData.to || !emailData.text) {
      setEmailStatus({
        loading: false,
        success: false,
        error: 'Please fill in all required fields'
      });
      return;
    }
    
    setEmailStatus({ loading: true, success: false, error: null });
    
    try {
      // Prepare email data
      const emailPayload = {
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text
      };
      
      // Send email using backend API
      const response = await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      setEmailStatus({ loading: false, success: true, error: null });
      
      // Reset email form
      setEmailData({ 
        to: '', 
        subject: 'LTI Master List Update', 
        text: '' 
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Failed to send email. Please check your backend configuration.'
      });
    }
  };
  
  // Get table headers from the first item or use defaults
  const getTableHeaders = () => {
    if (ltiItems.length > 0) {
      return Object.keys(ltiItems[0]).filter(key => key !== 'id');
    }
    return ['name', 'description', 'status', 'category', 'lastUpdated'];
  };
  
  const tableHeaders = getTableHeaders();

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">LTI Master List</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: '300px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant={showNeedsUpdateOnly ? "contained" : "outlined"}
              color="warning"
              startIcon={<WarningIcon />}
              onClick={() => setShowNeedsUpdateOnly(!showNeedsUpdateOnly)}
              sx={{ height: '40px' }}
            >
              {showNeedsUpdateOnly ? "Showing Updates Only" : "Show Updates Only"}
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {filteredItems.length} items found
            </Typography>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<CloudDownloadIcon />} 
              onClick={exportToExcel}
              sx={{ mr: 2 }}
            >
              Export Excel
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />} 
              onClick={() => setEmailDialog(true)}
              color="secondary"
              sx={{ mr: 2 }}
            >
              Send Email
            </Button>
            
            <Button 
              variant="contained" 
              color="success"
              onClick={() => navigate('/review')}
              disabled={!ltiItems.every(item => item.lastReviewed)}
            >
              Start Review
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="LTI master list table">
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                    {header.charAt(0).toUpperCase() + header.slice(1)}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableHeaders.length + 1} align="center">
                    {searchTerm ? 'No matching items found' : 'No items in the master list yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow 
                      key={item.id}
                      sx={{ 
                        backgroundColor: item.hasRelatedIsolations 
                          ? 'rgba(255, 152, 0, 0.2)' // Orange for related by prefix (first 3 digits match)
                          : (item.needsUpdate ? 'rgba(255, 152, 0, 0.1)' : 'inherit')
                      }}
                    >
                      {tableHeaders.map((header) => (
                        <TableCell key={`${item.id}-${header}`}>
                          {header === 'status' ? (
                            <Chip 
                              label={item[header]} 
                              color={item[header] === 'Active' ? 'success' : (item[header] === 'Pending' ? 'warning' : 'default')} 
                              size="small" 
                            />
                          ) : header === 'riskLevel' ? (
                            <Chip 
                              label={item[header]} 
                              color={
                                item[header] === 'High' ? 'error' : 
                                item[header] === 'Medium' ? 'warning' : 'success'
                              } 
                              size="small" 
                            />
                          ) : header === 'needsUpdate' ? (
                            <Chip 
                              label={item[header] ? 'Yes' : 'No'} 
                              color={item[header] ? 'warning' : 'success'} 
                              size="small" 
                            />
                          ) : header === 'isolationStartDate' || header === 'lastReviewed' || header === 'partsETA' || header === 'engineeringResponseETA' ? (
                            <Tooltip title={`Date: ${item[header] || 'Not specified'}`}>
                              <Typography variant="body2">
                                {item[header] || 'Not specified'}
                              </Typography>
                            </Tooltip>
                          ) : header === 'workOrderRequired' || header === 'partsRequired' || header === 'mocNeeded' || header === 'engineeringSupportNeeded' ? (
                            <Chip 
                              label={item[header] || 'No'} 
                              color={item[header] === 'Yes' ? 'primary' : 'default'} 
                              size="small" 
                            />
                          ) : header === 'additionalComments' || header === 'partsList' ? (
                            <Tooltip title={item[header] || 'None'}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 200, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap' 
                                }}
                              >
                                {item[header] || 'None'}
                              </Typography>
                            </Tooltip>
                          ) : header === 'systemEquipment' && item.hasRelatedIsolations ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {item[header]}
                              </Typography>
                              <Tooltip title={`Warning: Related isolations found (same first 3 digits after CAHE-). This may create additional risks that need to be considered during review.`}>
                                <WarningIcon color="warning" fontSize="small" />
                              </Tooltip>
                            </Box>
                          ) : (
                            item[header] !== undefined && item[header] !== null ? 
                            String(item[header]) : 
                            ''
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          Excel upload only
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem && selectedItem.id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={selectedItem?.name || ''}
              onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={selectedItem?.description || ''}
              onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
            />
            
            <TextField
              label="Category"
              fullWidth
              required
              value={selectedItem?.category || ''}
              onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
            />
            
            <TextField
              select
              label="Status"
              fullWidth
              value={selectedItem?.status || 'Active'}
              onChange={(e) => setSelectedItem({...selectedItem, status: e.target.value})}
              SelectProps={{
                native: true,
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Email Dialog */}
      <Dialog open={emailDialog} onClose={() => !emailStatus.loading && setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Email Notification</DialogTitle>
        <DialogContent>
          {emailStatus.loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Sending email...</Typography>
            </Box>
          ) : emailStatus.success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Email sent successfully!
            </Alert>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="To"
                fullWidth
                required
                value={emailData.to}
                onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                placeholder="recipient@example.com"
                helperText="Separate multiple recipients with commas"
              />
              
              <TextField
                label="Subject"
                fullWidth
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              />
              
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={6}
                value={emailData.text}
                onChange={(e) => setEmailData({...emailData, text: e.target.value})}
                placeholder="Enter your message here..."
              />
              
              {emailStatus.error && (
                <Alert severity="error">
                  {emailStatus.error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!emailStatus.loading && (
            <>
              <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
              <Button 
                onClick={sendEmail} 
                variant="contained" 
                color="primary"
                disabled={!emailData.to || !emailData.text}
              >
                Send Email
              </Button>
            </>
          )}
          {emailStatus.success && (
            <Button onClick={() => {
              setEmailDialog(false);
              setEmailStatus({ loading: false, success: false, error: null });
            }}>
              Close
            </Button>
          )}
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

export default LTIMasterListPage;
