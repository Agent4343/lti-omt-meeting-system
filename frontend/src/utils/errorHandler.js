/**
 * Error Handling Utility
 * Centralized error handling and user-friendly error messages
 */

import { FEATURE_FLAGS } from '../config';

export class ErrorHandler {
  /**
   * Log error for debugging
   */
  static logError(error, context = '') {
    if (FEATURE_FLAGS.ENABLE_LOGGING) {
      console.error(`[${new Date().toISOString()}] ${context}:`, error);
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error) {
    if (!error) return 'An unexpected error occurred';

    // Network errors
    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please check your internet connection and try again.';
    }

    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // PDF export errors
    if (error.message?.includes('jsPDF') || error.message?.includes('autoTable')) {
      return 'PDF generation failed. Please try again or contact support if the issue persists.';
    }

    // File upload errors
    if (error.message?.includes('File size') || error.message?.includes('file size')) {
      return 'File is too large. Please choose a file smaller than 10MB.';
    }

    if (error.message?.includes('File type') || error.message?.includes('file type')) {
      return 'Unsupported file type. Please upload an Excel file (.xlsx or .xls).';
    }

    // Email errors
    if (error.message?.includes('email') || error.message?.includes('Email')) {
      return 'Failed to send email. Please check the email address and try again.';
    }

    // Rate limiting errors
    if (error.message?.includes('Too many requests')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('Validation')) {
      return error.message; // Validation messages are usually user-friendly
    }

    // HTTP status errors
    if (error.message?.includes('HTTP 400')) {
      return 'Invalid request. Please check your input and try again.';
    }

    if (error.message?.includes('HTTP 401')) {
      return 'Authentication required. Please log in and try again.';
    }

    if (error.message?.includes('HTTP 403')) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    if (error.message?.includes('HTTP 404')) {
      return 'Resource not found. The requested data may no longer exist.';
    }

    if (error.message?.includes('HTTP 429')) {
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    }

    if (error.message?.includes('HTTP 5')) {
      return 'Server error. Please try again later or contact support.';
    }

    // SharePoint specific errors
    if (error.message?.includes('SharePoint') || error.message?.includes('SHAREPOINT')) {
      return 'SharePoint connection error. Please check your permissions and try again.';
    }

    // Browser compatibility errors
    if (error.message?.includes('not supported') || error.message?.includes('undefined')) {
      return 'This feature may not be supported in your browser. Please try using a modern browser like Chrome, Firefox, or Edge.';
    }

    // Generic fallback
    if (error.message && error.message.length < 200) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Handle error with logging and user notification
   */
  static handleError(error, context = '', showToUser = true) {
    this.logError(error, context);
    
    const userMessage = this.getUserFriendlyMessage(error);
    
    if (showToUser) {
      // This would integrate with your notification system
      // For now, we'll just return the message
      return {
        type: 'error',
        message: userMessage,
        technical: FEATURE_FLAGS.ENABLE_DEBUG ? error.message : undefined
      };
    }

    return userMessage;
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      const result = this.handleError(error, context);
      throw new Error(result.message || result);
    }
  }

  /**
   * Create error boundary fallback component data
   */
  static getErrorBoundaryProps(error, errorInfo) {
    this.logError(error, 'Error Boundary');
    
    return {
      title: 'Something went wrong',
      message: this.getUserFriendlyMessage(error),
      technical: FEATURE_FLAGS.ENABLE_DEBUG ? {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack
      } : undefined,
      actions: [
        {
          label: 'Reload Page',
          action: () => window.location.reload()
        },
        {
          label: 'Go Home',
          action: () => window.location.href = '/'
        }
      ]
    };
  }

  /**
   * Validate browser compatibility
   */
  static checkBrowserCompatibility() {
    const issues = [];

    // Check for basic modern browser features
    if (typeof fetch === 'undefined') {
      issues.push('Fetch API not supported');
    }

    if (typeof window.Promise === 'undefined') {
      issues.push('Promises not supported');
    }

    if (!Object.assign) {
      issues.push('Object.assign not supported');
    }

    // Check for specific features needed by the app
    if (typeof FileReader === 'undefined') {
      issues.push('File reading not supported');
    }

    if (typeof Blob === 'undefined') {
      issues.push('Blob API not supported');
    }

    if (issues.length > 0) {
      const error = new Error(`Browser compatibility issues: ${issues.join(', ')}`);
      error.name = 'BrowserCompatibilityError';
      throw error;
    }

    return true;
  }
}

export default ErrorHandler;