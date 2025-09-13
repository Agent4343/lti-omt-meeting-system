import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container,
  Alert,
  AlertTitle 
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import HomeIcon from '@mui/icons-material/Home';
import ErrorHandler from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorProps: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Use our centralized error handler
    const errorProps = ErrorHandler.getErrorBoundaryProps(error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorProps: errorProps
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorProps: null });
  };

  render() {
    if (this.state.hasError && this.state.errorProps) {
      const { title, message, technical } = this.state.errorProps;
      
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <BugReportIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" gutterBottom color="error">
              {title}
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>What Happened?</AlertTitle>
              {message}
            </Alert>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This error has been logged. You can try reloading the page or return to the home page.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
              <Button 
                variant="text" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </Box>
            
            {technical && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Technical Details (Development Mode):
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.100', 
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  <div>
                    <strong>Error:</strong> {technical.error}
                  </div>
                  {technical.stack && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Stack Trace:</strong>
                      <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{technical.stack}</pre>
                    </div>
                  )}
                  {technical.componentStack && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Component Stack:</strong>
                      <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{technical.componentStack}</pre>
                    </div>
                  )}
                </Paper>
              </Box>
            )}

            {/* Browser compatibility check */}
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              <Alert severity="info">
                <AlertTitle>Having trouble?</AlertTitle>
                • Make sure you're using a modern browser (Chrome, Firefox, Safari, or Edge)<br/>
                • Clear your browser cache and cookies<br/>
                • Disable browser extensions that might interfere<br/>
                • If using Internet Explorer, try switching to Edge or Chrome
              </Alert>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
