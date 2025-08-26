import { createTheme } from '@mui/material/styles';

// Define a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Back to standard blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e', // Back to standard pink/magenta
      light: '#ff4081',
      dark: '#9a0036', // Kept this dark variant, seems reasonable
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6f8', // Light grey background
      paper: '#ffffff', // White paper background
    },
    // Add other palette customizations if needed
    // success: { main: '#2e7d32' },
    // warning: { main: '#ed6c02' },
    // error: { main: '#d32f2f' },
    // info: { main: '#0288d1' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    // Define other typography variants if needed
  },
  shape: {
    borderRadius: 8, // Slightly more rounded corners
  },
  components: {
    // Example: Default elevation for Paper components
    MuiPaper: {
      styleOverrides: {
        root: {
          // elevation: 1, // Use a lower default elevation
        },
      },
      defaultProps: {
        elevation: 2, // Default elevation for Paper
      }
    },
    // Example: Default variant for Buttons
    MuiButton: {
      defaultProps: {
        // variant: 'contained', // Uncomment to make contained the default
      },
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase button text
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 1, // Lower elevation for AppBar
      }
    }
    // Add overrides for other components as needed
  },
});

export default theme;
