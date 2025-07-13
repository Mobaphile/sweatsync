// API service layer for SweatSync frontend
// This file contains all functions for communicating with the backend API

import logger from '../utils/logger.js';

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
      logger.apiResponse('POST', '/auth/login', response.status, {
        success: response.ok,
      });

      if (!response.ok) {
        logger.error('Login failed', new Error(data.error), {
          username,
          httpStatus: response.status,
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

      logger.apiResponse('POST', '/auth/register', response.status, {
        success: response.ok,
      });

      if (!response.ok) {
        logger.error('Registration failed', new Error(data.error), {
          username,
          httpStatus: response.status,
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
    logger.debug("Fetching today's workout");
    logger.startTimer('workout-fetch');

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/today`, {
        headers: api.getAuthHeaders(),
      });

      const data = await response.json();
      logger.endTimer('workout-fetch');

      logger.apiResponse('GET', '/workouts/today', response.status);

      if (!response.ok) {
        logger.error("Failed to fetch today's workout", new Error(data.error), {
          httpStatus: response.status,
        });
        throw new Error(data.error || 'Failed to fetch workout');
      }

      logger.info("Successfully fetched today's workout", {
        hasWorkout: !!data.workout,
        exerciseCount: data.workout?.exercises?.length || 0,
        workoutName: data.workout?.name || 'Unknown',
      });

      return data;
    } catch (error) {
      logger.endTimer('workout-fetch');
      logger.error("Today's workout fetch failed", error);
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
          httpStatus: response.status,
        });
        throw new Error(data.error || 'Failed to fetch weekly workouts');
      }

      const dayCount = data.plan?.schedule
        ? Object.keys(data.plan.schedule).length
        : 0;
      logger.info('Successfully fetched weekly workout plan', {
        planName: data.plan?.name || 'Unknown',
        daysCount: dayCount,
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          planData,
        }),
      });

      logger.apiResponse('POST', '/workouts/upload-plan', response.status);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Workout plan upload failed', new Error(error.error), {
          planName: name,
          httpStatus: response.status,
        });
        throw new Error(error.error || 'Failed to upload workout plan');
      }

      const result = await response.json();
      logger.info('Workout plan uploaded successfully', {
        planName: name,
        responseMessage: result.message,
      });

      return result;
    } catch (error) {
      logger.error('Workout plan upload error', error, { planName: name });
      throw error;
    }
  },

  // COMPLETE WORKOUT - saves completed workout data to backend
  completeWorkout: async workoutData => {
    const exerciseCount = workoutData.exercises?.length || 0;
    const workoutName = workoutData.workout?.name || 'Unknown';

    logger.userAction('Complete Workout', {
      workoutName,
      exerciseCount,
      date: workoutData.date,
    });
    logger.apiCall('POST', '/workouts/complete', {
      workoutName,
      exerciseCount,
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
          httpStatus: response.status,
        });
        throw new Error(data.error || 'Failed to save workout');
      }

      logger.info('Workout completed successfully', {
        workoutName,
        exerciseCount,
        workoutId: data.workout?.id,
      });

      return data;
    } catch (error) {
      logger.error('Workout completion error', error, {
        workoutName,
        exerciseCount,
      });
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
          httpStatus: response.status,
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
  deleteWorkout: async workoutId => {
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
          httpStatus: response.status,
        });
        throw new Error(data.error || 'Failed to delete workout');
      }

      logger.info('Workout deleted successfully', {
        workoutId,
        message: data.message,
      });

      return data;
    } catch (error) {
      logger.error('Workout deletion error', error, { workoutId });
      throw error;
    }
  },
};

export default api;
