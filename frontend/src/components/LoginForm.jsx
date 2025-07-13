import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import api from '../api/index.js';
import logger from '../utils/logger.js';
import errorHandler, { validators, errorUtils } from '../utils/errorHandler.js';

// LoginForm component - handles user authentication with improved error handling
const LoginForm = ({ onLogin, isLogin, setIsLogin }) => {
  // Component state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // Track field-specific errors

  // Clear errors when user starts typing
  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  // Validate form inputs before submission
  const validateForm = () => {
    const errors = {};

    try {
      validators.username(username);
    } catch (err) {
      errors.username = err.message;
    }

    try {
      validators.password(password);
    } catch (err) {
      errors.password = err.message;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with improved error handling
  const handleSubmit = async e => {
    e.preventDefault(); // Prevent form from refreshing page

    // Clear previous errors
    clearErrors();

    // Validate inputs first
    if (!validateForm()) {
      logger.warn('Form validation failed', { isLogin, username });
      return;
    }

    setLoading(true);

    try {
      // Use error wrapper for consistent handling
      const result = await errorUtils.withErrorHandling(
        async () => {
          return isLogin
            ? await api.login(username, password)
            : await api.register(username, password);
        },
        {
          operation: isLogin ? 'login' : 'register',
          username,
        }
      );

      // Success! Store token and notify parent
      localStorage.setItem('authToken', result.token);
      onLogin(result.user);

      logger.userAction(isLogin ? 'Login Success' : 'Registration Success', {
        username,
      });
    } catch (error) {
      // Error handler already logged the technical error
      // Now we just show the user-friendly message
      const userMessage = errorHandler.handleApiError(
        error,
        isLogin ? 'login' : 'registration'
      );
      setError(userMessage);

      // Check if user should retry (network errors)
      if (errorUtils.shouldRetry(error)) {
        // Optionally add a retry button or auto-retry logic here
        logger.info('Error is retryable', { error: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with error clearing
  const handleUsernameChange = e => {
    setUsername(e.target.value);
    if (fieldErrors.username) {
      setFieldErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = e => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Dumbbell className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Global error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Username field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={handleUsernameChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.username
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your username"
                disabled={loading}
              />
              {/* Field-specific error */}
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.password
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                disabled={loading}
              />
              {/* Field-specific error */}
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : isLogin ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </div>

          {/* Toggle between login and register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                clearErrors(); // Clear errors when switching
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
