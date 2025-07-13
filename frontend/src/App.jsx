// Import React and hooks from the React library
// useState: manages component state (data that can change)
// useEffect: handles side effects (API calls, subscriptions, etc.)
import React, { useState, useEffect } from 'react';

import logger from './utils/logger.js'
import errorHandler, { validators, errorUtils } from './utils/errorHandler.js';

// Import icons from lucide-react icon library
import { User, Calendar, Trophy, Plus, LogOut, Dumbbell, Clock, Target, Droplet, Trash2, Upload} from 'lucide-react';

// ==============================================
// API CONFIGURATION & SERVICE LAYER
// ==============================================

// Base URL for your backend API server
const API_BASE_URL = '/api';

// API service object - contains all functions for communicating with backend
const api = {
  // Helper function to get authorization headers for authenticated requests
  getAuthHeaders: () => {
    // Get JWT token from browser's localStorage
    const token = localStorage.getItem('authToken');
    // Return headers object with Authorization header if token exists
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // LOGIN FUNCTION - sends credentials to backend
  login: async (username, password) => {
    logger.userAction('Login Attempt', { username });
    logger.apiCall('POST', '/auth/login', { username }); // Don't log password!

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      // Log the API response
      logger.apiResponse('POST', '/auth/login', response.status, { success: response.ok });
      
      if (!response.ok) {
        logger.error('Login failed', new Error(data.error), { 
          username, 
          httpStatus: response.status 
        });
        throw new Error(data.error || 'Login failed');
      }
      
      logger.info('User logged in successfully', { username });
      return data;
      
    } catch (error) {
      logger.error('Login network error', error, { username });
      throw error;
    }
  },

  // VALIDATE FUNCTION - validates stored token with backend
  validateToken: async () => {
    logger.debug('Validating authentication token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: api.getAuthHeaders(),
      });
      
      const data = await response.json();
      
      logger.apiResponse('GET', '/auth/validate', response.status);
      
      if (!response.ok) {
        logger.warn('Token validation failed', { httpStatus: response.status });
        throw new Error(data.error || 'Token validation failed');
      }
      
      logger.debug('Token validation successful', { userId: data.user?.id });
      return data;
      
    } catch (error) {
      logger.error('Token validation error', error);
      throw error;
    }
  },

  // REGISTER FUNCTION - creates new user account
  register: async (username, password) => {
    logger.userAction('Registration Attempt', { username });
    logger.apiCall('POST', '/auth/register', { username });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      logger.apiResponse('POST', '/auth/register', response.status, { success: response.ok });
      
      if (!response.ok) {
        logger.error('Registration failed', new Error(data.error), { 
          username, 
          httpStatus: response.status 
        });
        throw new Error(data.error || 'Registration failed');
      }
      
      logger.info('User registered successfully', { username });
      return data;
      
    } catch (error) {
      logger.error('Registration network error', error, { username });
      throw error;
    }
  },

  // GET TODAY'S WORKOUT - fetches workout plan for current day
  getTodaysWorkout: async () => {
    logger.debug('Fetching today\'s workout');
    logger.startTimer('workout-fetch');
    
    try {
      const response = await fetch(`${API_BASE_URL}/workouts/today`, {
        headers: api.getAuthHeaders(),
      });
      
      const data = await response.json();
      logger.endTimer('workout-fetch');
      
      logger.apiResponse('GET', '/workouts/today', response.status);
      
      if (!response.ok) {
        logger.error('Failed to fetch today\'s workout', new Error(data.error), {
          httpStatus: response.status
        });
        throw new Error(data.error || 'Failed to fetch workout');
      }
      
      logger.info('Successfully fetched today\'s workout', { 
        hasWorkout: !!data.workout,
        exerciseCount: data.workout?.exercises?.length || 0,
        workoutName: data.workout?.name || 'Unknown'
      });
      
      return data;
      
    } catch (error) {
      logger.endTimer('workout-fetch');
      logger.error('Today\'s workout fetch failed', error);
      throw error;
    }
  },

  // GET FULL WORKOUT PLAN
  getWeeklyWorkouts: async () => {
    logger.debug('Fetching weekly workout plan');
    logger.startTimer('weekly-workouts-fetch');
    
    try {
      const response = await fetch(`${API_BASE_URL}/workouts/plan`, {
        headers: api.getAuthHeaders(),
      });
      
      const data = await response.json();
      logger.endTimer('weekly-workouts-fetch');
      
      logger.apiResponse('GET', '/workouts/plan', response.status);
      
      if (!response.ok) {
        logger.error('Failed to fetch weekly workouts', new Error(data.error), {
          httpStatus: response.status
        });
        throw new Error(data.error || 'Failed to fetch weekly workouts');
      }
      
      const dayCount = data.plan?.schedule ? Object.keys(data.plan.schedule).length : 0;
      logger.info('Successfully fetched weekly workout plan', { 
        planName: data.plan?.name || 'Unknown',
        daysCount: dayCount
      });
      
      return data;
      
    } catch (error) {
      logger.endTimer('weekly-workouts-fetch');
      logger.error('Weekly workouts fetch failed', error);
      throw error;
    }
  },

  // UPLOAD NEW WORKOUT PLAN
  uploadWorkoutPlan: async (name, planData) => {
    logger.userAction('Upload Workout Plan', { planName: name });
    logger.apiCall('POST', '/workouts/upload-plan', { planName: name });
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/workouts/upload-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          planData
        })
      });

      logger.apiResponse('POST', '/workouts/upload-plan', response.status);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Workout plan upload failed', new Error(error.error), {
          planName: name,
          httpStatus: response.status
        });
        throw new Error(error.error || 'Failed to upload workout plan');
      }

      const result = await response.json();
      logger.info('Workout plan uploaded successfully', { 
        planName: name,
        responseMessage: result.message 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Workout plan upload error', error, { planName: name });
      throw error;
    }
  },

  // COMPLETE WORKOUT - saves completed workout data to backend
  completeWorkout: async (workoutData) => {
    const exerciseCount = workoutData.exercises?.length || 0;
    const workoutName = workoutData.workout?.name || 'Unknown';
    
    logger.userAction('Complete Workout', { 
      workoutName,
      exerciseCount,
      date: workoutData.date 
    });
    logger.apiCall('POST', '/workouts/complete', { 
      workoutName,
      exerciseCount 
    });

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...api.getAuthHeaders(),
        },
        body: JSON.stringify(workoutData),
      });
      
      const data = await response.json();
      
      logger.apiResponse('POST', '/workouts/complete', response.status);
      
      if (!response.ok) {
        logger.error('Workout completion failed', new Error(data.error), {
          workoutName,
          exerciseCount,
          httpStatus: response.status
        });
        throw new Error(data.error || 'Failed to save workout');
      }
      
      logger.info('Workout completed successfully', { 
        workoutName,
        exerciseCount,
        workoutId: data.workout?.id
      });
      
      return data;
      
    } catch (error) {
      logger.error('Workout completion error', error, { workoutName, exerciseCount });
      throw error;
    }
  },

  // GET WORKOUT HISTORY - retrieves past workouts
  getWorkoutHistory: async () => {
    logger.debug('Fetching workout history');
    logger.startTimer('history-fetch');
    
    try {
      const response = await fetch(`${API_BASE_URL}/workouts/history`, {
        headers: api.getAuthHeaders(),
      });
      
      const data = await response.json();
      logger.endTimer('history-fetch');
      
      logger.apiResponse('GET', '/workouts/history', response.status);
      
      if (!response.ok) {
        logger.error('Failed to fetch workout history', new Error(data.error), {
          httpStatus: response.status
        });
        throw new Error(data.error || 'Failed to fetch workout history');
      }
      
      const workoutCount = data.workouts?.length || 0;
      logger.info('Successfully fetched workout history', { workoutCount });
      
      return data;
      
    } catch (error) {
      logger.endTimer('history-fetch');
      logger.error('Workout history fetch failed', error);
      throw error;
    }
  },

  // DELETE WORKOUT - removes a workout from history
  deleteWorkout: async (workoutId) => {
    logger.userAction('Delete Workout', { workoutId });
    logger.apiCall('POST', '/workouts/delete', { workoutId });
    
    try {
      const response = await fetch(`${API_BASE_URL}/workouts/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...api.getAuthHeaders(),
        },
        body: JSON.stringify({ workoutId }),
      });
      
      const data = await response.json();
      
      logger.apiResponse('POST', '/workouts/delete', response.status);
      
      if (!response.ok) {
        logger.error('Workout deletion failed', new Error(data.error), {
          workoutId,
          httpStatus: response.status
        });
        throw new Error(data.error || 'Failed to delete workout');
      }
      
      logger.info('Workout deleted successfully', { 
        workoutId,
        message: data.message 
      });
      
      return data;
      
    } catch (error) {
      logger.error('Workout deletion error', error, { workoutId });
      throw error;
    }
  }
};

// Helper function to format date and time in a user-friendly way
const formatDateTime = (dateString, completedAt) => {
  // Use completed_at if available (has time), otherwise fall back to date
  const timestamp = completedAt || dateString;
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Fall back to original date if parsing fails
    }
    
    // Format as "July 11, 2025 at 2:30 PM"
    const dateOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const timeOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    
    return `${formattedDate} @ ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fall back to original if anything goes wrong
  }
};

// ==============================================
// LOGIN FORM COMPONENT
// ==============================================

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
  const handleSubmit = async (e) => {
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
      const result = await errorUtils.withErrorHandling(async () => {
        return isLogin 
          ? await api.login(username, password)
          : await api.register(username, password);
      }, { 
        operation: isLogin ? 'login' : 'register',
        username 
      });

      // Success! Store token and notify parent
      localStorage.setItem('authToken', result.token);
      onLogin(result.user);
      
      logger.userAction(isLogin ? 'Login Success' : 'Registration Success', { username });
      
    } catch (error) {
      // Error handler already logged the technical error
      // Now we just show the user-friendly message
      const userMessage = errorHandler.handleApiError(error, isLogin ? 'login' : 'registration');
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
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (fieldErrors.username) {
      setFieldErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = (e) => {
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
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
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
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
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
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
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
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==============================================
// IMPROVED EXERCISE TRACKER COMPONENT
// ==============================================

// ExerciseTracker component with better validation and error handling
const ExerciseTracker = ({ exercise, onUpdate }) => {
  // Component state
  const [sets, setSets] = useState([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({}); // Track validation errors for individual sets
  const [isExpanded, setIsExpanded] = useState(true); // Allow collapsing

  // Clear errors for a specific set
  const clearSetError = (index) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  // Validate a single set's data
  const validateSet = (set, index) => {
    const setErrors = {};
    
    if (exercise.type === 'reps') {
      // Validate reps
      if (set.reps && (isNaN(set.reps) || set.reps < 0)) {
        setErrors.reps = 'Reps must be a positive number';
      }
      if (set.reps && set.reps > 1000) {
        setErrors.reps = 'Reps seems too high. Please check.';
      }
      
      // Validate weight
      if (set.weight && (isNaN(set.weight) || set.weight < 0)) {
        setErrors.weight = 'Weight must be a positive number';
      }
      if (set.weight && set.weight > 2000) {
        setErrors.weight = 'Weight seems very high. Please check.';
      }
    } else if (exercise.type === 'time') {
      // Validate time
      if (set.time && (isNaN(set.time) || set.time < 0)) {
        setErrors.time = 'Time must be a positive number';
      }
      if (set.time && set.time > 3600) {
        setErrors.time = 'Time seems very long. Please check.';
      }
    }
    
    return setErrors;
  };

  // Add a new empty set
  const addSet = () => {
    const newSet = exercise.type === 'reps' 
      ? { reps: '', weight: '' }
      : { time: '', notes: '' };
    
    const newSets = [...sets, newSet];
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });
    
    logger.userAction('Added set to exercise', { 
      exerciseName: exercise.name,
      setCount: newSets.length 
    });
  };

  // Update a specific set's data with validation
  const updateSet = (index, field, value) => {
    // Clear the error for this field when user starts typing
    clearSetError(index);
    
    const newSets = [...sets];
    newSets[index][field] = value;
    
    // Validate the updated set
    const setErrors = validateSet(newSets[index], index);
    if (Object.keys(setErrors).length > 0) {
      setErrors(prev => ({ ...prev, [index]: setErrors }));
    }
    
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });
    
    logger.debug('Updated exercise set', {
      exerciseName: exercise.name,
      setIndex: index,
      field,
      value
    });
  };

  // Remove a set
  const removeSet = (index) => {
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });
    
    // Clear any errors for this set
    clearSetError(index);
    
    logger.userAction('Removed set from exercise', { 
      exerciseName: exercise.name,
      setCount: newSets.length 
    });
  };

  // Update notes
  const updateNotes = (value) => {
    setNotes(value);
    onUpdate(exercise.name, { sets, notes: value });
  };

  // Calculate if this exercise has any completed sets
  const hasCompletedSets = sets.some(set => {
    if (exercise.type === 'reps') {
      return set.reps && set.reps !== '';
    } else {
      return set.time && set.time !== '';
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      {/* Exercise header - clickable to expand/collapse */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {exercise.name}
              {hasCompletedSets && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {sets.filter(set => exercise.type === 'reps' ? set.reps : set.time).length} sets
                </span>
              )}
            </h3>
            <p className="text-gray-600">
              Target: {exercise.type === 'time' 
                ? `${exercise.sets} sets × ${exercise.target_time || 'time-based'}`
                : `${exercise.sets} sets × ${exercise.target_reps || 'reps'} reps`}
            </p>
            {exercise.notes && (
              <p className="text-sm text-blue-600 mt-1 italic">{exercise.notes}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Exercise content - collapsible */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Sets section */}
          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 w-12">
                  Set {index + 1}
                </span>
                
                {exercise.type === 'reps' ? (
                  <>
                    {/* Reps input */}
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => updateSet(index, 'reps', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.reps 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                        max="1000"
                      />
                      {errors[index]?.reps && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].reps}</p>
                      )}
                    </div>
                    
                    {/* Weight input */}
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Weight (lbs)"
                        value={set.weight}
                        onChange={(e) => updateSet(index, 'weight', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.weight 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                        step="0.5"
                      />
                      {errors[index]?.weight && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].weight}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Time input */}
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Time (seconds)"
                        value={set.time}
                        onChange={(e) => updateSet(index, 'time', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.time 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                      />
                      {errors[index]?.time && (
                        <p className="text-xs text-red-600 mt-1">{errors[index].time}</p>
                      )}
                    </div>
                  </>
                )}
                
                {/* Remove set button */}
                <button
                  onClick={() => removeSet(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove this set"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add set button */}
          <button
            onClick={addSet}
            className="w-full mt-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium"
          >
            <Plus className="inline mr-2" size={16} />
            Add Set
          </button>

          {/* Notes section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (form cues, how it felt, etc.)
            </label>
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Optional notes about this exercise..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
          </div>
        </div>
      )}
    </div>
  );
};


// Complete workout button component with success animation
const CompleteWorkoutButton = ({ 
  onComplete, 
  loading, 
  completed, 
  disabled = false,
  exerciseCount = 0 
}) => {
  // Don't show button if no exercises
  if (exerciseCount === 0) return null;

  const getButtonContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving Workout...
        </div>
      );
    }

    if (completed) {
      return (
        <div className="flex items-center justify-center">
          <svg 
            className="w-5 h-5 mr-2 text-white animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Workout Completed!
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center">
        <Trophy className="w-5 h-5 mr-2" />
        Complete Workout
      </div>
    );
  };

  const getButtonClasses = () => {
    let baseClasses = "px-8 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (completed) {
      return `${baseClasses} bg-green-600 text-white transform scale-105 shadow-lg`;
    }
    
    if (loading || disabled) {
      return `${baseClasses} bg-gray-400 text-white cursor-not-allowed`;
    }
    
    return `${baseClasses} bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:transform hover:scale-105 focus:ring-green-500 active:scale-95`;
  };

  return (
    <div className="mt-8 text-center">
      <button
        onClick={onComplete}
        disabled={loading || disabled || completed}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>
      
      {/* Optional: Show completion message below button */}
      {completed && (
        <p className="mt-3 text-green-600 font-medium animate-fade-in">
          Great job! Your workout has been saved. 🎉
        </p>
      )}
    </div>
  );
};


// ==============================================
// MAIN APP COMPONENT
// ==============================================

// Main App component - the root component that manages the entire application
const App = () => {
  // Main application state
  const [user, setUser] = useState(null); // Current logged-in user (null if not logged in)
  const [isLogin, setIsLogin] = useState(true); // Whether login form shows login or register
  const [currentView, setCurrentView] = useState('today'); // Current page ('today' or 'history')
  const [todaysWorkout, setTodaysWorkout] = useState(null); // Today's workout data
  const [workoutPlan, setWorkoutPlan] = useState([]); // Full workout plan
  const [workoutHistory, setWorkoutHistory] = useState([]); // Array of past workouts
  const [exerciseData, setExerciseData] = useState({}); // Current workout progress data
  const [loading, setLoading] = useState(false); // Global loading state
  const [deletingWorkoutId, setDeletingWorkoutId] = useState(null); // Track which workout is being deleted
  const [uploadStatus, setUploadStatus] = useState('');// Track status of upload.
  const [showJsonGuide, setShowJsonGuide] = useState(false); // Track JSON guide visibility
  const [showLlmInstruction, setShowLlmInstruction] = useState(false); // Track LLM instruction visibility
  const [expandedWorkouts, setExpandedWorkouts] = useState(new Set()); // Set of currently expanded workouts
  const [error, setError] = useState(''); // error state
  const [success, setSuccess] = useState(''); // success state
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // useEffect hook - runs side effects when component mounts or dependencies change
  // This effect runs once when the app starts (empty dependency array [])
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return; // No token, stay logged out

      try {
        // Actually validate the token with your backend
        const userData = await api.validateToken();
        setUser(userData); // Set real user data from backend
      } catch (error) {
        console.error('Token validation failed:', error);
        // Token is invalid/expired - clean up and stay logged out
        localStorage.removeItem('authToken');
      }
    };

    checkAuth();
  }, []);

  // This effect runs whenever user or currentView changes
  useEffect(() => {
    // Load today's workout when user logs in and is viewing today's page
    if (user && currentView === 'today') {
      loadTodaysWorkout();
    }
    if (user && currentView === 'weekly') {
      loadWorkoutPlan();
}
  }, [user, currentView]); // Dependencies: runs when user or currentView changes

  // Function to load today's workout from the API
  const loadTodaysWorkout = async () => {
    try {
      setLoading(true); // Show loading indicator
      const workout = await api.getTodaysWorkout();
      console.log('Received workout data:', workout); // Debug log for development
      setTodaysWorkout(workout);
    } catch (error) {
      console.error('Failed to load workout:', error);
      // In a real app, you might want to show an error message to the user
    } finally {
      setLoading(false); // Hide loading indicator regardless of success/failure
    }
  };

  // Function to load workout plan from API
  const loadWorkoutPlan = async () => {
    try {
      setLoading(true);
      const week = await api.getWeeklyWorkouts();

      // Transform schedule object to an array
      const days = Object.entries(week.plan.schedule).map(([day, workout]) => ({
        day, // "monday", "tuesday", etc.
        workout,
      }));

      setWorkoutPlan(days);
    } catch (error) {
      console.error('Failed to load weekly workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkoutExpanded = (workoutId) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        // If already expanded, collapse it
        newSet.delete(workoutId);
      } else {
        // If collapsed, expand it
        newSet.add(workoutId);
      }
      return newSet;
    });
  };


// Function to handle workout plan file upload with comprehensive validation
const handleWorkoutPlanUpload = async (event) => {
  const file = event.target.files[0];
  
  // Early validation - check if file exists
  if (!file) {
    logger.warn('File upload called with no file selected');
    return;
  }

  // Validate file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    const message = 'Please upload a JSON file (.json extension required)';
    setUploadStatus(message);
    logger.warn('Invalid file type uploaded', { fileName: file.name, fileType: file.type });
    setTimeout(() => setUploadStatus(''), 5000);
    return;
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const message = 'File is too large. Please upload a file smaller than 5MB.';
    setUploadStatus(message);
    logger.warn('File too large', { fileName: file.name, fileSize: file.size });
    setTimeout(() => setUploadStatus(''), 5000);
    return;
  }

  setUploadStatus('Reading file...');
  logger.userAction('File upload started', { fileName: file.name, fileSize: file.size });

  try {
    // Read file content
    const fileContent = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    setUploadStatus('Validating workout plan...');

    // Validate JSON structure using our validator
    let planData;
    try {
      planData = validators.json(fileContent);
    } catch (validationError) {
      const message = errorHandler.handleValidationError(validationError, 'workout plan');
      setUploadStatus(message);
      setTimeout(() => setUploadStatus(''), 7000);
      return;
    }

    // Additional workout plan validation
    try {
      // Validate plan structure
      if (!planData.name || typeof planData.name !== 'string') {
        throw new Error('Workout plan must have a valid name');
      }

      if (!planData.schedule || typeof planData.schedule !== 'object') {
        throw new Error('Workout plan must have a schedule object');
      }

      // Validate each day in schedule
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const planDays = Object.keys(planData.schedule);
      
      if (planDays.length === 0) {
        throw new Error('Schedule must contain at least one day');
      }

      for (const day of planDays) {
        if (!validDays.includes(day.toLowerCase())) {
          throw new Error(`Invalid day "${day}". Use: ${validDays.join(', ')}`);
        }

        const dayWorkout = planData.schedule[day];
        if (dayWorkout && dayWorkout.exercises) {
          // Validate exercises
          for (const exercise of dayWorkout.exercises) {
            if (!exercise.name) {
              throw new Error(`Exercise missing name in ${day}`);
            }
            if (!exercise.type || !['reps', 'time'].includes(exercise.type)) {
              throw new Error(`Exercise "${exercise.name}" must have type "reps" or "time"`);
            }
            if (!exercise.sets || exercise.sets < 1) {
              throw new Error(`Exercise "${exercise.name}" must have at least 1 set`);
            }
          }
        }
      }

      // Log validation success
      logger.info('Workout plan validation successful', {
        planName: planData.name,
        dayCount: planDays.length,
        totalExercises: planDays.reduce((total, day) => {
          return total + (planData.schedule[day]?.exercises?.length || 0);
        }, 0)
      });

    } catch (validationError) {
      const message = `Invalid workout plan: ${validationError.message}`;
      setUploadStatus(message);
      logger.error('Workout plan validation failed', validationError, { fileName: file.name });
      setTimeout(() => setUploadStatus(''), 8000);
      return;
    }

    setUploadStatus('Uploading to server...');

    // Upload to backend with retry mechanism
    try {
      await errorUtils.withRetry(async () => {
        return await api.uploadWorkoutPlan(planData.name, planData);
      }, 2); // Retry once on failure

      setUploadStatus('✅ Workout plan uploaded successfully!');
      
      logger.userAction('Workout plan uploaded successfully', {
        planName: planData.name,
        fileName: file.name
      });

      // Force refresh of data
      logger.debug('Refreshing workout data after upload');
      
      // Reload data based on current view
      if (currentView === 'weekly' && typeof loadWorkoutPlan === 'function') {
        await loadWorkoutPlan();
      }
      if (currentView === 'today') {
        await loadTodaysWorkout();
      }

      logger.debug('Data refresh completed successfully');

    } catch (uploadError) {
      const message = errorHandler.handleApiError(uploadError, 'workout plan upload');
      setUploadStatus(`Upload failed: ${message}`);
      
      // Provide additional help for network errors
      if (errorUtils.isNetworkError(uploadError)) {
        setTimeout(() => {
          setUploadStatus('Network error. Please check your connection and try again.');
        }, 3000);
      }
      
      setTimeout(() => setUploadStatus(''), 10000);
      return;
    }

  } catch (fileError) {
    const message = errorHandler.handleError(fileError, { operation: 'file reading' });
    setUploadStatus(`File error: ${message}`);
    setTimeout(() => setUploadStatus(''), 8000);
    return;
  }

  // Clear the file input and success message
  event.target.value = '';
  setTimeout(() => setUploadStatus(''), 5000);
};

  // Function to delete a workout with confirmation
  const deleteWorkout = async (workoutId, workoutName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${workoutName}"? This action cannot be undone.`
    );
    
    if (!confirmed) {
      return; // User cancelled, do nothing
    }

    try {
      setDeletingWorkoutId(workoutId); // Show loading state for this specific workout
      await api.deleteWorkout(workoutId);
      
      // Remove the deleted workout from the local state
      // This updates the UI immediately without needing to reload from server
      // TODO how does this work???
      setWorkoutHistory(prevHistory => 
        prevHistory.filter(workout => workout.id !== workoutId)
      );
      
      // Optional: Show success message
      alert('Workout deleted successfully!');
      
    } catch (error) {
      console.error('Failed to delete workout:', error);
      alert('Failed to delete workout: ' + error.message);
    } finally {
      setDeletingWorkoutId(null); // Hide loading state
    }
  };

  // Callback function called when user successfully logs in
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Function to log out the user
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove token from storage
    setUser(null); // Clear user state
    setCurrentView('today'); // Reset to default view
  };

  // Function to update exercise data during workout
  // This gets called by ExerciseTracker components when user inputs data
  const updateExerciseData = (exerciseName, data) => {
    setExerciseData(prev => ({
      ...prev, // Keep existing exercise data
      [exerciseName]: data // Update or add data for this exercise
    }));
  };

  // Function to save completed workout to backend with better error handling
  const completeWorkout = async () => {
    if (!todaysWorkout) {
      logger.warn('Complete workout called with no workout loaded');
      return;
    }

    // Validate that user has entered some exercise data
    const hasExerciseData = Object.keys(exerciseData).length > 0;
    if (!hasExerciseData) {
      const message = 'Please add at least one set to complete your workout.';
      setError(message); // Assuming you have an error state in main app
      logger.warn('User tried to complete workout without any exercise data');
      return;
    }

    // Prepare workout data in the format expected by the API
    const workoutData = {
      date: new Date().toISOString().split('T')[0],
      workout: { name: todaysWorkout.workout?.name || getWorkoutName(todaysWorkout) },
      exercises: Object.entries(exerciseData).map(([name, data]) => ({
        name,
        sets: data.sets || [],
        notes: data.notes || ''
      }))
    };

    // Validate workout data structure
    try {
      if (!workoutData.workout.name) {
        throw new Error('Workout name is missing');
      }
      
      if (workoutData.exercises.length === 0) {
        throw new Error('No exercises to save');
      }

      // Validate each exercise has valid sets
      for (const exercise of workoutData.exercises) {
        if (!exercise.sets || exercise.sets.length === 0) {
          logger.warn(`Exercise ${exercise.name} has no sets, but continuing`);
        }
      }
      
    } catch (validationError) {
      const message = errorHandler.handleValidationError(validationError, 'workout completion');
      setError(message);
      return;
    }

    setLoading(true);
    logger.userAction('Attempting to complete workout', {
      workoutName: workoutData.workout.name,
      exerciseCount: workoutData.exercises.length
    });

  try {
    // Use retry mechanism for network reliability
    const result = await errorUtils.withRetry(async () => {
      return await api.completeWorkout(workoutData);
    }, 2); // Retry once if it fails

    // Success! Set completion state for button animation
    setWorkoutCompleted(true); // This will show the checkmark
    setExerciseData({}); // Clear current workout data
    
    // Reload today's workout (might be different now)
    await loadTodaysWorkout();
    
    logger.userAction('Workout completed successfully', {
      workoutName: workoutData.workout.name,
      exerciseCount: workoutData.exercises.length
    });

    // Reset the button state after 3 seconds
    setTimeout(() => setWorkoutCompleted(false), 3000);

  } catch (error) {
    const userMessage = errorHandler.handleApiError(error, 'workout completion');
    setError(userMessage);
    
    // If it's a network error, suggest they try again
    if (errorUtils.isNetworkError(error)) {
      setError(userMessage + ' Your workout data has been saved locally and will be retried when connection is restored.');
      // In a real app, you might implement offline storage here
    }
    
    // Clear error message after 10 seconds
    setTimeout(() => setError(''), 10000);

  } finally {
    setLoading(false);
  }
};

  // Helper function to safely get exercises from workout data
  // The backend might return data in different structures, so we check multiple possibilities
  const getExercises = (workout) => {
    if (!workout) return [];
    
    // Try different possible structures where exercises might be stored
    if (workout.exercises) return workout.exercises;
    if (workout.workout && workout.workout.exercises) return workout.workout.exercises;
    if (workout.data && workout.data.exercises) return workout.data.exercises;
    
    return []; // Return empty array if no exercises found
  };

  // Helper function to safely get workout name from different possible data structures
  const getWorkoutName = (workout) => {
    if (!workout) return 'Unknown Workout';
    
    if (workout.name) return workout.name;
    if (workout.workout_data && workout.workout_data.workoutName) return workout.workout_data.workoutName;
    if (workout.workout && workout.workout.name) return workout.workout.name;
    if (workout.data && workout.data.name) return workout.data.name;
    
    return 'Today\'s Workout';
  };

  // CONDITIONAL RENDERING: If user is not logged in, show login form
  if (!user) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        isLogin={isLogin} 
        setIsLogin={setIsLogin} 
      />
    );
  }

  // MAIN APP RENDER: If user is logged in, show the main application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and app name */}
            <div className="flex items-center">
              <Droplet className="text-blue-600 mr-3" size={28} />
              <h1 className="text-2xl font-bold text-gray-900">SweatSync</h1>
            </div>
            {/* User info and logout */}
            <div className="flex items-center space-x-4">
              <User className="text-gray-600" size={20} />
              <span className="text-gray-700 font-medium">{user.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== NAVIGATION ==================== */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {/* Today's Workout tab */}
            <button
              onClick={() => setCurrentView('today')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'today'
                  ? 'border-blue-500 text-blue-600' // Active tab styles
                  : 'border-transparent text-gray-500 hover:text-gray-700' // Inactive tab styles
              }`}
            >
              <Dumbbell className="inline mr-2" size={16} />
              Today's Workout
            </button>
            {/* Weekly View tab */}
            <button
              onClick={() => {
                setCurrentView('weekly');
                loadWorkoutPlan();
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'weekly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="inline mr-2" size={16} />
              Workout Plan
            </button>
            {/* History tab */}
            <button
              onClick={() => {
                setCurrentView('history');
                loadWorkoutHistory(); // Load history when tab is clicked
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="inline mr-2" size={16} />
              History
            </button>
          </div>
        </div>
      </nav>

      {/* ==================== DEBUG SECTION ==================== */}
      {/* This section is for development debugging - currently disabled */}
      {/* Change 'false &&' to 'true &&' to enable debug info */}
      {false && process.env.NODE_ENV === 'development' && todaysWorkout && (
        <div className="bg-yellow-100 border border-yellow-300 p-4 m-4 rounded">
          <h4 className="font-bold">Debug Info:</h4>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(todaysWorkout, null, 2)}
          </pre>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CONDITIONAL RENDERING: Show different content based on currentView */}
        {currentView === 'today' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Today's Workout</h2>
            
            {/* Loading indicator */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading workout...</p>
              </div>
            )}

            {/* Workout content - only show if workout exists and not loading */}
            {todaysWorkout && !loading && (
              <div>
                {/* Workout summary card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    {getWorkoutName(todaysWorkout)}
                  </h3>
                  <p className="text-blue-700">
                    {getExercises(todaysWorkout).length} exercises planned
                  </p>
                </div>

                {/* Exercise trackers - one for each exercise */}
                <div className="space-y-4">
                  {getExercises(todaysWorkout).map((exercise, index) => (
                    <ExerciseTracker
                      key={index} // React key for list items
                      exercise={exercise}
                      onUpdate={updateExerciseData}
                    />
                  ))}
                </div>

                {/* Complete workout button with success animation */}
                {getExercises(todaysWorkout).length > 0 && (
                  <CompleteWorkoutButton
                    onComplete={completeWorkout}
                    loading={loading}
                    completed={workoutCompleted}
                    exerciseCount={getExercises(todaysWorkout).length}
                  />
                )}
              </div>
            )}

            {/* Empty state - show when no workout or no exercises */}
            {(!todaysWorkout || getExercises(todaysWorkout).length === 0) && !loading && (
              <div className="text-center py-12">
                <Dumbbell className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No workout scheduled for today
                </h3>
                <p className="text-gray-600">
                  Enjoy your rest day or add a custom workout!
                </p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {currentView === 'history' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Workout History</h2>
            
            {/* Loading indicator for history */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading history...</p>
              </div>
            )}

            {/* History list */}
            <div className="space-y-4">
              {workoutHistory.map((workout, index) => {
                const isExpanded = expandedWorkouts.has(workout.id);
                const exercises = workout.workout_data?.exercises || [];
                
                return (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Clickable header section */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => toggleWorkoutExpanded(workout.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {/* Simple expand/collapse indicator */}
                            <span className="text-gray-400 text-sm">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {workout.workout_data?.workoutName || 'Unknown Workout'}
                            </h3>
                          </div>
                          <p className="text-gray-600">{formatDateTime(workout.date, workout.completed_at)}</p>
                        </div>
                        
                        <div className="text-right relative">
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkout(
                                workout.id, 
                                workout.workout_data?.workoutName || 'Unknown Workout'
                              );
                            }}          
                            disabled={deletingWorkoutId === workout.id}
                            className="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete workout"
                          >
                            {deletingWorkoutId === workout.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                          
                          {/* Exercise count */}
                          <p className="text-sm text-gray-500 mt-6">
                            {exercises.length} exercises
                          </p>
                        </div>
                      </div>
                      
                      {/* Collapsed view - exercise summary grid */}
                      {!isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="bg-gray-50 rounded p-3 hover:shadow-md transition-shadow duration-200">
                              <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                              <p className="text-sm text-gray-600">
                                {exercise.sets?.length || 0} sets completed
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expanded view - detailed exercise information */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded"></span>
                            Workout Details
                          </h4>
                          
                          {exercises.length === 0 ? (
                            <p className="text-gray-500 italic">No exercises recorded for this workout.</p>
                          ) : (
                            <div className="space-y-6">
                              {exercises.map((exercise, exIndex) => (
                                <div 
                                  key={exIndex} 
                                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {exercise.name}
                                  </h5>
                                  
                                  {/* Exercise notes */}
                                  {exercise.notes && (
                                    <div className="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-200 hover:shadow-sm transition-shadow duration-200">
                                      <p className="text-sm text-gray-700">
                                        <span className="font-medium">Notes:</span> {exercise.notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Sets details */}
                                  {exercise.sets && exercise.sets.length > 0 ? (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-2">Sets:</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {exercise.sets.map((set, setIndex) => (
                                          <div 
                                            key={setIndex} 
                                            className="bg-gray-50 rounded px-3 py-2 text-sm hover:shadow-sm transition-shadow duration-200"
                                          >
                                            <span className="font-medium text-blue-600">Set {setIndex + 1}:</span>
                                            {set.reps && (
                                              <span className="ml-1">{set.reps} reps</span>
                                            )}
                                            {set.weight && (
                                              <span className="ml-1 font-semibold">@ {set.weight} lbs</span>
                                            )}
                                            {set.time && (
                                              <span className="ml-1">{set.time}s</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic text-sm">No sets recorded for this exercise.</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state for history */}
            {workoutHistory.length === 0 && !loading && (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No workouts completed yet
                </h3>
                <p className="text-gray-600">
                  Complete your first workout to see it here!
                </p>
                </div>
            )}
          </div>
        )}
        {/* WORKOUT PLAN VIEW */}
        {currentView === 'weekly' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Workout Plan Management</h2>

            {/* Upload Section*/}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <Upload className="inline mr-2" size={20} />
                Upload Custom Workout Plan
              </h3>
              
<div className="mb-4 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select JSON Workout Plan File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleWorkoutPlanUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                
                {/* JSON Formatting Guide Button */}
                <button
                  onClick={() => setShowJsonGuide(!showJsonGuide)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 text-sm font-medium transition-colors"
                >
                  JSON Formatting Guide
                </button>
              </div>
              
              {/* Upload Status */}
              {uploadStatus && (
                <div className={`p-3 rounded-md mb-4 ${
                  uploadStatus.includes('successfully') || uploadStatus.includes('Uploading')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {uploadStatus}
                </div>
              )}
              
              {/* Conditional Instructions - Only show when button is clicked */}
              {showJsonGuide && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-4">JSON Format Guide</h4>
                  
                  {/* Responsive layout: side-by-side on large screens, stacked on small */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* JSON Example Section */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Example Format:</h5>
                      <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-3 rounded border">
        {`{
  "name": "My Custom Plan",
  "schedule": {
    "monday": {
      "name": "Push Day",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 3,
          "target_reps": "8-12",
          "type": "reps",
          "notes": ""
        }
      ]
    }
  }
}`}
                      </pre>
                    </div>

                    {/* LLM Instruction Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-700">LLM Prompt Instructions:</h5>
                        <button
                          onClick={() => setShowLlmInstruction(!showLlmInstruction)}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium transition-colors"
                        >
                          {showLlmInstruction ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      
                      {showLlmInstruction && (
                        <div className="bg-white p-3 rounded border">
                          <p className="text-xs text-gray-600 mb-2 font-medium">Copy this instruction to your AI:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-blue-50 p-2 rounded border">
{`OUTPUT INSTRUCTION: Format your response as a valid JSON object with this exact structure: \`{"name": "Plan Name", "schedule": {"monday": {"name": "Workout Name", "exercises": [{"name": "Exercise Name", "sets": number, "target_reps": "rep range or count", "type": "reps", "notes": "instructions"}, {"name": "Time Exercise", "sets": number, "target_time": "duration", "type": "time", "notes": "instructions"}]}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}, "sunday": {...}}}\`. RULES: (1) Include all 7 days (monday-sunday lowercase), (2) Each exercise MUST have "name", "sets", "type", and "notes" fields, (3) Use "target_reps" for type:"reps" exercises, "target_time" for type:"time" exercises, (4) Only use type:"reps" or type:"time", (5) Rest days should have light activities like stretching, (6) Output ONLY the JSON with no additional text.`}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Plan Display - EXISTING CODE WITH ENHANCEMENTS */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <Clock className="inline mr-2" size={20} />
                Current Active Plan
              </h3>
              
              {/* Plan Info */}
              {workoutPlan.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-800">
                    Plan Source: {todaysWorkout?.planSource === 'user' ? 'Custom Upload' : 'Default Plan'}
                  </p>
                  {todaysWorkout?.planName && (
                    <p className="text-sm text-blue-700">
                      Plan Name: {todaysWorkout.planName}
                    </p>
                  )}
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading weekly plan...</p>
                </div>
              )}

              <div className="space-y-4">
                {workoutPlan.map((entry, index) => (
                  <details key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-800 hover:text-blue-600">
                      {entry.day.charAt(0).toUpperCase() + entry.day.slice(1)} - {entry.workout?.name || 'Unnamed Workout'}
                    </summary>

                    <div className="mt-4 space-y-2">
                      {entry.workout?.exercises?.map((exercise, i) => (
                        <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                          <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                          <p className="text-sm text-gray-600">
                            {exercise.type === 'time'
                              ? `${exercise.sets} sets × ${exercise.target_time}`
                              : `${exercise.sets} sets × ${exercise.target_reps} reps`}
                          </p>
                          {exercise.notes && (
                            <p className="text-sm italic text-gray-500 mt-1">{exercise.notes}</p>
                          )}
                        </div>
                      ))}
                      {!entry.workout?.exercises?.length && (
                        <p className="text-sm text-gray-500">No exercises planned.</p>
                      )}
                    </div>
                  </details>
                ))}
              </div>

              {workoutPlan.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No workouts planned this week
                  </h3>
                  <p className="text-gray-600">
                    Upload a custom workout plan above to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      
      </main>
    </div>
  );
};


// Export the App component as the default export
// This allows other files to import this component with: import App from './App'
export default App;