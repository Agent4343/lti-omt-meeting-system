/**
 * API Client Utility
 * Centralized API communication with proper error handling and configuration
 */

import { API_BASE_URL, FEATURE_FLAGS } from '../config';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 10000; // 10 seconds default timeout
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    try {
      if (FEATURE_FLAGS.ENABLE_LOGGING) {
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (FEATURE_FLAGS.ENABLE_LOGGING) {
        console.log(`API Response: ${response.status}`, data);
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${this.timeout}ms`);
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }

      if (FEATURE_FLAGS.ENABLE_LOGGING) {
        console.error(`API Error: ${url}`, error);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.makeRequest(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Backend server is not responding: ${error.message}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(emailData) {
    if (!FEATURE_FLAGS.ENABLE_EMAIL_NOTIFICATIONS) {
      throw new Error('Email notifications are disabled');
    }

    try {
      const response = await this.post('/send-email', emailData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send reminder email
   */
  async sendReminder(reminderData) {
    if (!FEATURE_FLAGS.ENABLE_EMAIL_NOTIFICATIONS) {
      throw new Error('Email notifications are disabled');
    }

    try {
      const response = await this.post('/send-reminder', reminderData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send reminder: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
const apiClient = new APIClient();

export default apiClient;

// Named exports for specific functions
export const {
  healthCheck,
  sendEmail,
  sendReminder
} = apiClient;