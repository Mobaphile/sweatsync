// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================
// This utility provides user-friendly error handling and validation

import logger from './logger.js';

// Map technical errors to user-friendly messages
const ERROR_MESSAGES = {
  // Network/Connection errors
  'Failed to fetch':
    'Unable to connect to server. Please check your internet connection.',
  'Network request failed': 'Connection problem. Please try again.',
  'TypeError: Failed to fetch':
    'Connection problem. Please check your internet connection.',

  // Authentication errors
  'Invalid credentials': 'Username or password is incorrect.',
  'Token validation failed': 'Your session has expired. Please log in again.',
  'User not found': 'Username or password is incorrect.',
  'Username already exists':
    'This username is already taken. Please choose another.',

  // Workout errors
  'Failed to fetch workout':
    "Could not load today's workout. Please try again.",
  'Failed to save workout': 'Could not save your workout. Please try again.',
  'Workout not found': 'This workout could not be found.',

  // Validation errors
  'Please fill in all fields': 'Please fill in all required fields.',
  'Password too short': 'Password must be at least 6 characters long.',
  'Invalid JSON':
    'The uploaded file format is invalid. Please check your JSON file.',

  // Generic fallbacks
  'Internal server error': 'Something went wrong on our end. Please try again.',
  'Something went wrong!': 'An unexpected error occurred. Please try again.',
};

// Error handler class
class ErrorHandler {
  // Convert technical error to user-friendly message
  getUserFriendlyMessage(error) {
    if (!error) return 'An unexpected error occurred.';

    const errorMessage = error.message || error.toString();

    // Look for exact matches first
    if (ERROR_MESSAGES[errorMessage]) {
      return ERROR_MESSAGES[errorMessage];
    }

    // Look for partial matches
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    // Log unknown errors for future improvement
    logger.warn('Unknown error type encountered', { errorMessage });

    // Return generic message for unknown errors
    return 'Something went wrong. Please try again.';
  }

  // Handle errors with consistent logging and user feedback
  handleError(error, context = {}) {
    // Log the technical error
    logger.error('Error occurred', error, context);

    // Return user-friendly message
    return this.getUserFriendlyMessage(error);
  }

  // Handle API errors specifically
  handleApiError(error, operation = 'operation') {
    const context = { operation, category: 'api_error' };
    return this.handleError(error, context);
  }

  // Handle form validation errors
  handleValidationError(error, formName = 'form') {
    const context = { formName, category: 'validation_error' };
    return this.handleError(error, context);
  }
}

// Validation utilities
export const validators = {
  // Validate required fields
  required: (value, fieldName = 'field') => {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  },

  // Validate password strength
  password: password => {
    validators.required(password, 'Password');

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    return true;
  },

  // Validate username format
  username: username => {
    validators.required(username, 'Username');

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    // Basic username validation - alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error(
        'Username can only contain letters, numbers, and underscores'
      );
    }

    return true;
  },

  // Validate JSON file content
  json: jsonString => {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate workout plan structure
      if (parsed.name && parsed.schedule) {
        return parsed;
      } else {
        throw new Error(
          'Invalid JSON: Must include "name" and "schedule" fields'
        );
      }
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  },
};

// Utility functions for common error scenarios
export const errorUtils = {
  // Wrapper for async operations with error handling
  withErrorHandling: async (operation, errorContext = {}) => {
    try {
      return await operation();
    } catch (error) {
      const userMessage = errorHandler.handleError(error, errorContext);
      throw new Error(userMessage);
    }
  },

  // Retry mechanism for failed operations
  withRetry: async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, {
          error: error.message,
          attempt,
        });

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    logger.error(`Operation failed after ${maxRetries} attempts`, lastError);
    throw lastError;
  },

  // Check if error is network-related (might be temporary)
  isNetworkError: error => {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('connection')
    );
  },

  // Check if error suggests user should retry
  shouldRetry: error => {
    return (
      errorUtils.isNetworkError(error) ||
      error.message.includes('server error') ||
      error.message.includes('timeout')
    );
  },
};

// Create and export error handler instance
const errorHandler = new ErrorHandler();
export default errorHandler;
