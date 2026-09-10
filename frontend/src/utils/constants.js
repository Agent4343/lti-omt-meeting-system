// Application Constants
// Note: APP_NAME, APP_VERSION, API_BASE_URL, and FILE_CONFIG are defined in ../config.js
// Import them from config.js to avoid duplication

import { APP_NAME, APP_VERSION, API_BASE_URL, FILE_CONFIG, FEATURE_FLAGS } from '../config';

export const APP_CONFIG = {
  // Re-export from config.js for backward compatibility
  APP_NAME,
  VERSION: APP_VERSION,

  // File Export Settings - reference FILE_CONFIG from config.js
  EXPORT: {
    EXCEL_EXTENSION: '.xlsx',
    PDF_EXTENSION: '.pdf',
    MAX_FILE_SIZE: FILE_CONFIG.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: FILE_CONFIG.ALLOWED_FILE_TYPES
  },

  // Date Formats
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'MM/DD/YYYY',
    TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
  },

  // Risk Levels
  RISK_LEVELS: {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
  },

  // LTI Age Thresholds
  LTI_AGE_THRESHOLDS: {
    DAYS_TO_MONTHS: 30,
    DAYS_TO_YEARS: 365
  },

  // UI Constants
  UI: {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    MAX_ITEMS_PER_PAGE: 50
  },

  // Storage Keys
  STORAGE_KEYS: {
    SAVED_PEOPLE: 'savedPeople',
    MEETING_PEOPLE: 'meetingPeople',
    SAVED_MEETINGS: 'savedMeetings',
    CURRENT_MEETING: 'currentMeetingInfo'
  }
};

// Environment Configuration - reference config.js values
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: API_BASE_URL,
  enableLogging: FEATURE_FLAGS.ENABLE_LOGGING
};

// Validation Rules
export const VALIDATION_RULES = {
  ISOLATION_ID: {
    pattern: /^CAHE-\d{3}-\d{3}$/,
    message: 'Isolation ID must follow format: CAHE-XXX-XXX'
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  DATE: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format'
  }
};
