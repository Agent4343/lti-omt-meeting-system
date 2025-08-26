// Input validation and sanitization utilities

/**
 * Sanitize string input by removing potentially harmful characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid date format
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj) && date.match(/^\d{4}-\d{2}-\d{2}$/);
};

/**
 * Validate that date is not in the past
 * @param {string} date - Date string to validate (YYYY-MM-DD format)
 * @returns {boolean} - True if date is today or in the future
 */
export const isDateNotInPast = (date) => {
  if (!isValidDate(date)) return false;
  
  // Parse the input date string (YYYY-MM-DD) to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const inputDate = new Date(year, month - 1, day); // month is 0-indexed
  
  // Get today's date in local timezone
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return inputDate >= todayDate;
};

/**
 * Validate person name
 * @param {string} name - Name to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validatePersonName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Name is required' };
  }
  
  const sanitized = sanitizeString(name);
  if (sanitized.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, message: 'Name must be less than 100 characters' };
  }
  
  if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitized)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate meeting date
 * @param {string} date - Date to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateMeetingDate = (date) => {
  if (!date) {
    return { isValid: false, message: 'Meeting date is required' };
  }
  
  if (!isValidDate(date)) {
    return { isValid: false, message: 'Please enter a valid date' };
  }
  
  if (!isDateNotInPast(date)) {
    return { isValid: false, message: 'Meeting date cannot be in the past' };
  }
  
  return { isValid: true };
};

/**
 * Validate attendee list
 * @param {Array} attendees - Array of attendee names
 * @returns {object} - Validation result with isValid and message
 */
export const validateAttendees = (attendees) => {
  if (!Array.isArray(attendees)) {
    return { isValid: false, message: 'Attendees must be an array' };
  }
  
  if (attendees.length === 0) {
    return { isValid: false, message: 'At least one attendee is required' };
  }
  
  if (attendees.length > 50) {
    return { isValid: false, message: 'Maximum 50 attendees allowed' };
  }
  
  // Check for duplicates
  const uniqueAttendees = [...new Set(attendees)];
  if (uniqueAttendees.length !== attendees.length) {
    return { isValid: false, message: 'Duplicate attendees found' };
  }
  
  // Validate each attendee name
  for (const attendee of attendees) {
    const nameValidation = validatePersonName(attendee);
    if (!nameValidation.isValid) {
      return { isValid: false, message: `Invalid attendee name: ${nameValidation.message}` };
    }
  }
  
  return { isValid: true };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result with isValid and message
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['.xlsx', '.xls'],
    required = true
  } = options;
  
  if (!file) {
    return { isValid: !required, message: required ? 'File is required' : '' };
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` 
    };
  }
  
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return { 
      isValid: false, 
      message: `File type must be one of: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitize and validate form data
 * @param {object} formData - Form data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation result with isValid, errors, and sanitized data
 */
export const validateFormData = (formData, schema) => {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];
    
    // Apply validation rules
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break;
      }
      
      // Store sanitized value if provided
      if (result.sanitized !== undefined) {
        sanitizedData[field] = result.sanitized;
      } else {
        sanitizedData[field] = value;
      }
    }
  }
  
  return { isValid, errors, sanitizedData };
};

// Common validation rules
export const validationRules = {
  required: (value) => ({
    isValid: value !== null && value !== undefined && value !== '',
    message: 'This field is required'
  }),
  
  minLength: (min) => (value) => ({
    isValid: !value || value.length >= min,
    message: `Must be at least ${min} characters long`
  }),
  
  maxLength: (max) => (value) => ({
    isValid: !value || value.length <= max,
    message: `Must be less than ${max} characters long`
  }),
  
  email: (value) => ({
    isValid: !value || isValidEmail(value),
    message: 'Please enter a valid email address'
  }),
  
  personName: validatePersonName,
  meetingDate: validateMeetingDate
};
