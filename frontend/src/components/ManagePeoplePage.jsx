import { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Box, 
  Container, 
  Paper, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function ManagePeoplePage() {
  const navigate = useNavigate();
  const { people, setPeople } = useAppContext();
  const [newPerson, setNewPerson] = useState('');
  const [editingPerson, setEditingPerson] = useState({ index: -1, name: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddPerson = () => {
    if (!newPerson.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    
    if (people.includes(newPerson.trim())) {
      setSnackbar({ open: true, message: 'This person already exists', severity: 'error' });
      return;
    }
    
    setPeople([...people, newPerson.trim()]);
    setNewPerson('');
    setSnackbar({ open: true, message: 'Person added successfully', severity: 'success' });
  };

  const handleDeletePerson = (index) => {
    const updatedPeople = [...people];
    updatedPeople.splice(index, 1);
    setPeople(updatedPeople);
    setSnackbar({ open: true, message: 'Person removed successfully', severity: 'success' });
  };

  const handleEditClick = (index) => {
    setEditingPerson({ index, name: people[index] });
    setOpenDialog(true);
  };

  const handleEditSave = () => {
    if (!editingPerson.name.trim()) {
      setSnackbar({ open: true, message: 'Name cannot be empty', severity: 'error' });
      return;
    }
    
    if (people.includes(editingPerson.name.trim()) && people[editingPerson.index] !== editingPerson.name.trim()) {
      setSnackbar({ open: true, message: 'This person already exists', severity: 'error' });
      return;
    }
    
    const updatedPeople = [...people];
    updatedPeople[editingPerson.index] = editingPerson.name.trim();
    setPeople(updatedPeople);
    setOpenDialog(false);
    setSnackbar({ open: true, message: 'Person updated successfully', severity: 'success' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Manage People</Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box display="flex" mb={4}>
          <TextField
            label="Add New Person"
            fullWidth
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            placeholder="Enter name"
            sx={{ mr: 2 }}
          />
          <Button 
            variant="contained" 
            onClick={handleAddPerson}
            sx={{ minWidth: '120px' }}
          >
            Add Person
          </Button>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          People List ({people.length})
        </Typography>
        
        {people.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No people added yet. Add people to include them in meetings.
          </Alert>
        ) : (
          <List>
            {people.map((person, index) => (
              <ListItem key={index} divider>
                <ListItemText primary={person} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleEditClick(index)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeletePerson(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
        
        <Button 
          variant="outlined" 
          sx={{ mt: 4 }} 
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Paper>
      
      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editingPerson.name}
            onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
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

export default ManagePeoplePage;
