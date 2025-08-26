// Application Constants
export const APP_CONFIG = {
  APP_NAME: 'LTI OMT Meeting System',
  VERSION: '4.0.0',
  
  // File Export Settings
  EXPORT: {
    EXCEL_EXTENSION: '.xlsx',
    PDF_EXTENSION: '.pdf',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
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

// Environment Configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true' || process.env.NODE_ENV === 'development'
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
