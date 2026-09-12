/**
 * Project Configuration
 * 
 * This file contains configuration settings for the React application.
 * Uses environment variables for flexible deployment across different environments.
 */

// React version configuration
export const REACT_VERSION = '18.2.0';

// UI Framework configuration
export const UI_FRAMEWORK = 'Material-UI';
export const UI_FRAMEWORK_VERSION = '5.17.1';

// State Management configuration
export const STATE_MANAGEMENT = 'React Context API';

// Application configuration - uses environment variables with fallbacks
export const APP_NAME = process.env.REACT_APP_APP_NAME || 'LTI OMT Meeting System';
export const APP_VERSION = process.env.REACT_APP_VERSION || '4.0.0';

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === 'true' || process.env.NODE_ENV === 'development',
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  ENABLE_PDF_EXPORT: process.env.REACT_APP_ENABLE_PDF_EXPORT !== 'false', // Default true
  ENABLE_EMAIL_NOTIFICATIONS: process.env.REACT_APP_ENABLE_EMAIL_NOTIFICATIONS !== 'false', // Default true
  ENABLE_LAZY_LOADING: process.env.REACT_APP_ENABLE_LAZY_LOADING !== 'false' // Default true
};

// Enablon (source system for LTI / isolation data)
// Users export the LTI list from here, then upload it into this app.
// NOTE: this is the dashboard entry point, not a copy of a login URL. Sign-in
// links carry one-time `state` and `code_challenge` values that expire within
// minutes, so they cannot be reused as a permanent link - going to the
// dashboard lets SSO issue a fresh login instead.
export const ENABLON_CONFIG = {
  URL: process.env.REACT_APP_ENABLON_URL || 'https://exxonmobil-orm.us.enablon.io/dashboard',
  LABEL: process.env.REACT_APP_ENABLON_LABEL || 'Get LTI list from Enablon'
};

// File configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10485760, // 10MB default
  ALLOWED_FILE_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
};

// Development configuration
export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: process.env.REACT_APP_ENABLE_CONSOLE_LOGS === 'true' || process.env.NODE_ENV === 'development',
  CHUNK_SIZE_WARNING_LIMIT: parseInt(process.env.REACT_APP_CHUNK_SIZE_WARNING_LIMIT) || 512000
};
