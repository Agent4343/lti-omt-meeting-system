import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Backdrop,
  Paper 
} from '@mui/material';

// Full-screen loading overlay
export const LoadingOverlay = ({ open, message = 'Loading...' }) => (
  <Backdrop
    sx={{ 
      color: '#fff', 
      zIndex: (theme) => theme.zIndex.drawer + 1,
      flexDirection: 'column',
      gap: 2
    }}
    open={open}
  >
    <CircularProgress color="inherit" size={60} />
    <Typography variant="h6">{message}</Typography>
  </Backdrop>
);

// Inline loading spinner
export const LoadingSpinner = ({ 
  size = 40, 
  message = 'Loading...', 
  centered = true,
  variant = 'inline' // 'inline', 'card', 'minimal'
}) => {
  const content = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        ...(centered && {
          justifyContent: 'center',
          minHeight: variant === 'card' ? 200 : 100
        })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant={variant === 'minimal' ? 'body2' : 'body1'} 
          color="text.secondary"
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (variant === 'card') {
    return (
      <Paper elevation={1} sx={{ p: 4, m: 2 }}>
        {content}
      </Paper>
    );
  }

  return content;
};

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  component: Component = 'button',
  ...props 
}) => (
  <Box sx={{ position: 'relative', display: 'inline-block' }}>
    <Component {...props} disabled={loading || props.disabled}>
      {loading ? loadingText : children}
    </Component>
    {loading && (
      <CircularProgress
        size={24}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: '-12px',
          marginLeft: '-12px',
        }}
      />
    )}
  </Box>
);

export default LoadingSpinner;
