// ==========================================
// LOGGING UTILITY
// ==========================================
// This utility provides structured logging with consistent formatting
// and different log levels for better debugging and monitoring

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Format log message with timestamp and context
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      message,
      ...context
    };

    return {
      formatted: `[${timestamp}] ${level.toUpperCase()}: ${message}`,
      object: logObject
    };
  }

  // DEBUG level - only shown in development
  debug(message, context = {}) {
    if (this.isDevelopment) {
      const { formatted, object } = this.formatMessage('debug', message, context);
      console.log(formatted, object);
    }
  }

  // INFO level - general information
  info(message, context = {}) {
    const { formatted, object } = this.formatMessage('info', message, context);
    console.info(formatted, object);
  }

  // WARN level - something unexpected but not breaking
  warn(message, context = {}) {
    const { formatted, object } = this.formatMessage('warn', message, context);
    console.warn(formatted, object);
  }

  // ERROR level - actual errors that need attention
  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      ...(error && {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name
      })
    };

    const { formatted, object } = this.formatMessage('error', message, errorContext);
    console.error(formatted, object);

    // In production, you might want to send errors to a monitoring service
    // this.sendToErrorService(object);
  }

  // API call logging - track API requests and responses
  apiCall(method, url, data = null) {
    this.debug('API Call', {
      method,
      url,
      data: data ? JSON.stringify(data) : null,
      category: 'api'
    });
  }

  // API response logging
  apiResponse(method, url, status, data = null, error = null) {
    const context = {
      method,
      url,
      status,
      category: 'api',
      ...(data && { responseData: JSON.stringify(data) })
    };

    if (error || status >= 400) {
      this.error(`API Error: ${method} ${url}`, error, context);
    } else {
      this.debug(`API Success: ${method} ${url}`, context);
    }
  }

  // User action logging - track what users are doing
  userAction(action, context = {}) {
    this.info(`User Action: ${action}`, {
      ...context,
      category: 'user_action'
    });
  }

  // Performance logging - track timing of operations
  startTimer(label) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  endTimer(label) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Future: Send errors to monitoring service (like Sentry)
  sendToErrorService(logObject) {
    // Placeholder for production error tracking
    // Example: Sentry.captureMessage(logObject.message, logObject);
  }
}

// Create and export a single instance
const logger = new Logger();

export default logger;