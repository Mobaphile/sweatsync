// Import React and hooks from the React library
// useState: manages component state (data that can change)
// useEffect: handles side effects (API calls, subscriptions, etc.)
import React, { useState, useEffect } from 'react';

// Import icons from lucide-react icon library
import { User, Calendar, Trophy, Plus, LogOut, Dumbbell, Clock, Target } from 'lucide-react';

// ==============================================
// API CONFIGURATION & SERVICE LAYER
// ==============================================

// Base URL for your backend API server
const API_BASE_URL = 'http://10.0.0.162:3000/api';

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
    // Make POST request to login endpoint
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Tell server we're sending JSON
      body: JSON.stringify({ username, password }), // Convert object to JSON string
    });
    
    // Parse response as JSON
    const data = await response.json();
    
    // If request failed, throw error with message
    if (!response.ok) throw new Error(data.error || 'Login failed');
    
    // Return the data (usually contains token and user info)
    return data;
  },

  // REGISTER FUNCTION - creates new user account
  register: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // GET TODAY'S WORKOUT - fetches workout plan for current day
  getTodaysWorkout: async () => {
    const response = await fetch(`${API_BASE_URL}/workouts/today`, {
      headers: api.getAuthHeaders(), // Include auth token in headers
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch workout');
    return data;
  },

  // COMPLETE WORKOUT - saves completed workout data to backend
  completeWorkout: async (workoutData) => {
    const response = await fetch(`${API_BASE_URL}/workouts/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...api.getAuthHeaders(), // Spread operator to include auth headers
      },
      body: JSON.stringify(workoutData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save workout');
    return data;
  },

  // GET WORKOUT HISTORY - fetches user's past workouts
  getWorkoutHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/workouts/history`, {
      headers: api.getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch history');
    return data;
  },
};

// ==============================================
// LOGIN FORM COMPONENT
// ==============================================

// LoginForm component - handles user authentication
// Props: onLogin (callback function), isLogin (boolean), setIsLogin (state setter)
const LoginForm = ({ onLogin, isLogin, setIsLogin }) => {
  // Component state - data that belongs to this component
  const [username, setUsername] = useState(''); // Current username input
  const [password, setPassword] = useState(''); // Current password input
  const [error, setError] = useState('');       // Error message to display
  const [loading, setLoading] = useState(false); // Loading state for button

  // Handle form submission (login or register)
  const handleSubmit = async () => {
    // Validation - check if fields are filled
    if (!username || !password) {
      setError('Please fill in all fields');
      return; // Exit early if validation fails
    }
    
    // Reset error message and show loading state
    setError('');
    setLoading(true);

    try {
      // Call appropriate API function based on isLogin state
      const result = isLogin 
        ? await api.login(username, password)
        : await api.register(username, password);
      
      // Save token to localStorage for future requests
      localStorage.setItem('authToken', result.token);
      
      // Call parent component's onLogin callback with user data
      onLogin(result.user);
    } catch (err) {
      // Display error message if login/register fails
      setError(err.message);
    } finally {
      // Always stop loading, regardless of success or failure
      setLoading(false);
    }
  };

  // JSX return - the actual HTML-like structure that gets rendered
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Header section with logo and title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Dumbbell className="text-blue-600 mr-2" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">SweatSync</h1>
          </div>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          {/* Username input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username} // Controlled input - value comes from state
              onChange={(e) => setUsername(e.target.value)} // Update state on change
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Error message - only shows if error exists */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading} // Disable button while loading
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </div>

        {/* Toggle between login and register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)} // Toggle isLogin state
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// EXERCISE TRACKER COMPONENT
// ==============================================

// ExerciseTracker component - handles individual exercise tracking during workout
// Props: exercise (object with exercise data), onUpdate (callback function)
const ExerciseTracker = ({ exercise, onUpdate }) => {
  // Component state for this exercise
  const [sets, setSets] = useState([]); // Array of sets [{reps: '', weight: ''}, ...]
  const [notes, setNotes] = useState(''); // User notes for this exercise

  // Add a new empty set to the exercise
  const addSet = () => {
    setSets([...sets, { reps: '', weight: '' }]); // Spread operator creates new array
  };

  // Update a specific set's data (reps or weight)
  const updateSet = (index, field, value) => {
    const newSets = [...sets]; // Create copy of sets array
    newSets[index][field] = value; // Update the specific field
    setSets(newSets); // Update local state
    onUpdate(exercise.name, { sets: newSets, notes }); // Notify parent component
  };

  // Remove a set from the exercise
  const removeSet = (index) => {
    const newSets = sets.filter((_, i) => i !== index); // Filter out the set at index
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Exercise header */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{exercise.name}</h3>
      <p className="text-gray-600 mb-4">Target: {exercise.target_reps} reps × {exercise.sets} sets</p>
      
      {/* Sets tracking */}
      <div className="space-y-3">
        {/* Map over sets array to create input fields for each set */}
        {sets.map((set, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className="text-gray-500 w-8">#{index + 1}</span>
            {/* Reps input */}
            <input
              type="number"
              placeholder="Reps"
              value={set.reps}
              onChange={(e) => updateSet(index, 'reps', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
            {/* Weight input */}
            <input
              type="number"
              placeholder="Weight"
              value={set.weight}
              onChange={(e) => updateSet(index, 'weight', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
            {/* Remove set button */}
            <button
              onClick={() => removeSet(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add set button */}
      <button
        onClick={addSet}
        className="mt-3 flex items-center text-blue-600 hover:text-blue-800"
      >
        <Plus size={16} className="mr-1" />
        Add Set
      </button>

      {/* Notes section */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            // Update parent component immediately when notes change
            onUpdate(exercise.name, { sets, notes: e.target.value });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows="2"
          placeholder="How did this exercise feel?"
        />
      </div>
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
  const [workoutHistory, setWorkoutHistory] = useState([]); // Array of past workouts
  const [exerciseData, setExerciseData] = useState({}); // Current workout progress data
  const [loading, setLoading] = useState(false); // Global loading state

  // useEffect hook - runs side effects when component mounts or dependencies change
  // This effect runs once when the app starts (empty dependency array [])
  useEffect(() => {
    // Check if user was previously logged in by looking for auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real app, you'd validate the token with your backend
      // For now, we'll just assume it's valid and set a dummy user
      setUser({ username: 'User' });
    }
  }, []); // Empty dependency array means this runs once on mount

  // This effect runs whenever user or currentView changes
  useEffect(() => {
    // Load today's workout when user logs in and is viewing today's page
    if (user && currentView === 'today') {
      loadTodaysWorkout();
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

  // Function to load workout history from the API
  const loadWorkoutHistory = async () => {
    try {
      setLoading(true);
      const history = await api.getWorkoutHistory();
      console.log('Received history data:', history); // Debug log
      setWorkoutHistory(history.workouts || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
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

  // Function to save completed workout to backend
  const completeWorkout = async () => {
    if (!todaysWorkout) return; // Exit if no workout loaded

    // Prepare workout data in the format expected by the API
    const workoutData = {
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      workout: { name: todaysWorkout.name },
      exercises: Object.entries(exerciseData).map(([name, data]) => ({
        name,
        sets: data.sets || [],
        notes: data.notes || ''
      }))
    };

    try {
      await api.completeWorkout(workoutData);
      alert('Workout completed successfully!'); // Simple user feedback
      setExerciseData({}); // Clear current workout data
      loadTodaysWorkout(); // Reload today's workout (might be different now)
    } catch (error) {
      alert('Failed to save workout: ' + error.message);
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
              <Dumbbell className="text-blue-600 mr-3" size={28} />
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
              <Calendar className="inline mr-2" size={16} />
              Today's Workout
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
              <Trophy className="inline mr-2" size={16} />
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

                {/* Complete workout button - only show if there are exercises */}
                {getExercises(todaysWorkout).length > 0 && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={completeWorkout}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Complete Workout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty state - show when no workout or no exercises */}
            {(!todaysWorkout || getExercises(todaysWorkout).length === 0) && !loading && (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
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
              {workoutHistory.map((workout, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {workout.workout_data?.workoutName || 'Unknown Workout'}
                      </h3>
                      <p className="text-gray-600">{workout.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {workout.workout_data?.exercises?.length || 0} exercises
                      </p>
                    </div>
                  </div>
                  
                  {/* Exercise summary grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workout.workout_data?.exercises?.map((exercise, exIndex) => (
                      <div key={exIndex} className="bg-gray-50 rounded p-3">
                        <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                        <p className="text-sm text-gray-600">
                          {exercise.sets?.length || 0} sets completed
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for history */}
            {workoutHistory.length === 0 && !loading && (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
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
      </main>
    </div>
  );
};


// Export the App component as the default export
// This allows other files to import this component with: import App from './App'
export default App;