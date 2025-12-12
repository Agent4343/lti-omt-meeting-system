// Polyfills for legacy environments (e.g. SharePoint 2013 corporate desktops)
// NOTE: Material UI v5 does not officially support IE11, but these polyfills help with older engines.
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'whatwg-fetch';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material'; // Import CssBaseline
import { AppContextProvider } from './context/AppContext';
import theme from './theme'; // Import the custom theme from theme.js
import { REACT_VERSION, UI_FRAMEWORK, UI_FRAMEWORK_VERSION } from './config';

// Log configuration to ensure it's loaded
console.log(`Using React v${REACT_VERSION} with ${UI_FRAMEWORK} v${UI_FRAMEWORK_VERSION}`);

// Theme is now imported from theme.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppContextProvider>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Add CssBaseline for baseline styling */}
      <App />
    </ThemeProvider>
  </AppContextProvider>
);
