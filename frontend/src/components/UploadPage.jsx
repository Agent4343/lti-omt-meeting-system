import { useState, useRef } from 'react';
import {
  Button,
  Typography,
  Box,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import PropTypes from 'prop-types';
import { validateFileUpload } from '../utils/validation';
import { FILE_CONFIG } from '../config';

function UploadPage({ setIsolations }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file
    const validation = validateFileUpload(file, {
      maxSize: FILE_CONFIG.MAX_FILE_SIZE,
      allowedTypes: ['.xlsx', '.xls']
    });

    if (!validation.isValid) {
      setError(validation.message);
      setSnackbar({ open: true, message: validation.message, severity: 'error' });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });

          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            throw new Error('Excel file contains no sheets');
          }

          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (!data || data.length === 0) {
            throw new Error('Excel file contains no data');
          }

          setIsolations(data);
          setSnackbar({ open: true, message: `Successfully loaded ${data.length} records`, severity: 'success' });

          // Navigate after a brief delay to show success message
          setTimeout(() => navigate('/review'), 500);
        } catch (parseError) {
          setError(parseError.message || 'Failed to parse Excel file');
          setSnackbar({ open: true, message: parseError.message || 'Failed to parse Excel file', severity: 'error' });
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setSnackbar({ open: true, message: 'Failed to read file', severity: 'error' });
        setLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setSnackbar({ open: true, message: err.message || 'An unexpected error occurred', severity: 'error' });
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          Upload Excel File
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload an Excel file (.xlsx or .xls) containing isolation data.
          Maximum file size: {Math.round(FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={loading}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleButtonClick}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          sx={{ mb: 2 }}
        >
          {loading ? 'Processing...' : 'Select File'}
        </Button>

        {fileName && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <DescriptionIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="body2" color="text.secondary">
              {fileName}
            </Typography>
          </Box>
        )}
      </Paper>

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

UploadPage.propTypes = {
  setIsolations: PropTypes.func.isRequired
};

export default UploadPage;
