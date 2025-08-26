import { VALIDATION_RULES, APP_CONFIG } from './constants';

/**
 * Data Validation Utilities for LTI OMT Meeting System
 * Addresses high-priority data integrity issues
 */

// Meeting Data Schema Validation
export const validateMeetingData = (meetingData) => {
  const errors = [];
  
  try {
    // Basic structure validation
    if (!meetingData || typeof meetingData !== 'object') {
      errors.push('Meeting data must be a valid object');
      return { isValid: false, errors };
    }
    
    // Required fields validation
    const requiredFields = ['date', 'timestamp'];
    requiredFields.forEach(field => {
      if (!meetingData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Date validation
    if (meetingData.date && !VALIDATION_RULES.DATE.pattern.test(meetingData.date)) {
      errors.push(`Invalid date format: ${meetingData.date}. ${VALIDATION_RULES.DATE.message}`);
    }
    
    // Attendees validation
    if (meetingData.attendees && !Array.isArray(meetingData.attendees)) {
      errors.push('Attendees must be an array');
    }
    
    // Isolations validation
    if (meetingData.isolations) {
      if (!Array.isArray(meetingData.isolations)) {
        errors.push('Isolations must be an array');
      } else {
        meetingData.isolations.forEach((isolation, index) => {
          const isolationErrors = validateIsolationData(isolation);
          if (!isolationErrors.isValid) {
            errors.push(`Isolation ${index + 1}: ${isolationErrors.errors.join(', ')}`);
          }
        });
      }
    }
    
    // Responses validation
    if (meetingData.responses && typeof meetingData.responses !== 'object') {
      errors.push('Responses must be an object');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
};

// Isolation Data Validation
export const validateIsolationData = (isolation) => {
  const errors = [];
  
  try {
    if (!isolation || typeof isolation !== 'object') {
      errors.push('Isolation must be a valid object');
      return { isValid: false, errors };
    }
    
    // ID validation
    if (!isolation.id) {
      errors.push('Isolation ID is required');
    } else if (!VALIDATION_RULES.ISOLATION_ID.pattern.test(isolation.id)) {
      errors.push(VALIDATION_RULES.ISOLATION_ID.message);
    }
    
    // Description validation
    if (!isolation.description && !isolation.Title && !isolation.title) {
      errors.push('Isolation description is required');
    }
    
    // Planned start date validation
    const plannedStartDate = isolation['Planned Start Date'] || 
                           isolation.plannedStartDate || 
                           isolation.PlannedStartDate;
    
    if (plannedStartDate && !isValidDate(plannedStartDate)) {
      errors.push('Invalid planned start date format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Isolation validation error: ${error.message}`]
    };
  }
};

// Response Data Validation
export const validateResponseData = (response) => {
  const errors = [];
  
  try {
    if (!response || typeof response !== 'object') {
      errors.push('Response must be a valid object');
      return { isValid: false, errors };
    }
    
    // Risk level validation
    if (response.riskLevel || response.risk) {
      const riskLevel = response.riskLevel || response.risk;
      const validRiskLevels = Object.values(APP_CONFIG.RISK_LEVELS);
      if (!validRiskLevels.includes(riskLevel)) {
        errors.push(`Invalid risk level: ${riskLevel}. Must be one of: ${validRiskLevels.join(', ')}`);
      }
    }
    
    // MOC validation
    if (response.mocRequired && !['Yes', 'No'].includes(response.mocRequired)) {
      errors.push('MOC Required must be "Yes" or "No"');
    }
    
    // Parts validation
    if (response.partsRequired && !['Yes', 'No'].includes(response.partsRequired)) {
      errors.push('Parts Required must be "Yes" or "No"');
    }
    
    // Action items validation
    if (response.actionItems && !Array.isArray(response.actionItems)) {
      errors.push('Action items must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Response validation error: ${error.message}`]
    };
  }
};

// File Upload Validation
export const validateFileUpload = (file) => {
  const errors = [];
  
  try {
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }
    
    // File size validation
    if (file.size > APP_CONFIG.EXPORT.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${APP_CONFIG.EXPORT.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    // File type validation
    if (!APP_CONFIG.EXPORT.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Allowed types: ${APP_CONFIG.EXPORT.ALLOWED_FILE_TYPES.join(', ')}`);
    }
    
    // File name validation
    if (!file.name || file.name.trim() === '') {
      errors.push('File name is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`File validation error: ${error.message}`]
    };
  }
};

// Input Sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Date Validation and Standardization
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

export const standardizeDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Return in ISO format (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
};

// Data Backup/Restore Utilities
export const createDataBackup = () => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: APP_CONFIG.VERSION,
      data: {
        savedPeople: JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE) || '[]'),
        meetingPeople: JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE) || '[]'),
        savedMeetings: JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS) || '[]'),
        currentMeeting: JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_MEETING) || 'null')
      }
    };
    
    return {
      success: true,
      data: backupData
    };
  } catch (error) {
    return {
      success: false,
      error: `Backup creation failed: ${error.message}`
    };
  }
};

export const restoreDataBackup = (backupData) => {
  try {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data format');
    }
    
    // Validate backup data structure
    const validation = validateBackupData(backupData);
    if (!validation.isValid) {
      throw new Error(`Invalid backup data: ${validation.errors.join(', ')}`);
    }
    
    // Restore data to localStorage
    const { data } = backupData;
    
    if (data.savedPeople) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_PEOPLE, JSON.stringify(data.savedPeople));
    }
    
    if (data.meetingPeople) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.MEETING_PEOPLE, JSON.stringify(data.meetingPeople));
    }
    
    if (data.savedMeetings) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SAVED_MEETINGS, JSON.stringify(data.savedMeetings));
    }
    
    if (data.currentMeeting) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CURRENT_MEETING, JSON.stringify(data.currentMeeting));
    }
    
    return {
      success: true,
      message: 'Data restored successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: `Data restore failed: ${error.message}`
    };
  }
};

const validateBackupData = (backupData) => {
  const errors = [];
  
  if (!backupData.timestamp) {
    errors.push('Missing backup timestamp');
  }
  
  if (!backupData.version) {
    errors.push('Missing backup version');
  }
  
  if (!backupData.data || typeof backupData.data !== 'object') {
    errors.push('Missing or invalid backup data');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export validation summary
export const getValidationSummary = (data) => {
  const summary = {
    totalItems: 0,
    validItems: 0,
    invalidItems: 0,
    errors: []
  };
  
  if (Array.isArray(data)) {
    summary.totalItems = data.length;
    
    data.forEach((item, index) => {
      const validation = validateMeetingData(item);
      if (validation.isValid) {
        summary.validItems++;
      } else {
        summary.invalidItems++;
        summary.errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });
  }
  
  return summary;
};
