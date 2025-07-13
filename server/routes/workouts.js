const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current workout plan
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    let plan = null;
    let planSource = 'default';
    
    // First, try to get user's custom workout plan
    try {
      const userPlan = await database.getUserWorkoutPlan(req.user.id);
      if (userPlan) {
        plan = userPlan.plan_data;
        planSource = 'user';
      }
    } catch (error) {
      console.warn('Could not load user workout plan, falling back to default:', error);
    }
    
    // If no user plan, fall back to default file-based plan
    if (!plan) {
      const planPath = path.join(__dirname, '../workout-plans/current-plan.json');
      const planData = await fs.readFile(planPath, 'utf8');
      plan = JSON.parse(planData);
      planSource = 'default';
    }
    
    res.json({ 
      plan,
      planSource,
      planName: plan.name || 'Current Plan'
    });
    
  } catch (error) {
    console.error('Error loading workout plan:', error);
    res.status(500).json({ error: 'Failed to load workout plan' });
  }
});

// Upload and save user workout plan
router.post('/upload-plan', authenticateToken, async (req, res) => {
  try {
    const { name, planData } = req.body;
    
    // Validation: Check required fields
    if (!name || !planData) {
      return res.status(400).json({ 
        error: 'Workout plan name and data are required' 
      });
    }
    
    // Validation: Check if planData has the expected structure
    if (!planData.schedule || typeof planData.schedule !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid workout plan format. Must include a schedule object.' 
      });
    }
    
    // Validation: Check if at least one day has exercises
    const days = Object.keys(planData.schedule);
    if (days.length === 0) {
      return res.status(400).json({ 
        error: 'Workout plan must include at least one day with exercises' 
      });
    }
    
    // Save the workout plan to database
    const savedPlan = await database.saveUserWorkoutPlan(
      req.user.id, 
      name, 
      planData
    );
    
    res.json({
      message: 'Workout plan uploaded successfully',
      plan: {
        id: savedPlan.id,
        name: savedPlan.name,
        active: savedPlan.active
      }
    });
    
  } catch (error) {
    console.error('Error uploading workout plan:', error);
    
    // Handle specific database errors
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ 
        error: 'Invalid workout plan data' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload workout plan' 
    });
  }
});

// Get today's workout
// Get today's workout
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    let plan = null;
    let planSource = 'default';
    
    // First, try to get user's custom workout plan
    try {
      const userPlan = await database.getUserWorkoutPlan(req.user.id);
      if (userPlan) {
        plan = userPlan.plan_data;
        planSource = 'user';
      }
    } catch (error) {
      console.warn('Could not load user workout plan, falling back to default:', error);
    }
    
    // If no user plan, fall back to default file-based plan
    if (!plan) {
      const planPath = path.join(__dirname, '../workout-plans/current-plan.json');
      const planData = await fs.readFile(planPath, 'utf8');
      plan = JSON.parse(planData);
      planSource = 'default';
    }
    
    const todaysWorkout = plan.schedule[dayName];
    
    if (!todaysWorkout) {
      return res.json({ 
        message: 'No workout scheduled for today',
        date: today.toISOString().split('T')[0],
        planSource
      });
    }
    
    res.json({
      date: today.toISOString().split('T')[0],
      workout: todaysWorkout,
      planSource, // Let frontend know if this is user's custom plan or default
      planName: plan.name || 'Current Plan'
    });
    
  } catch (error) {
    console.error('Error getting today\'s workout:', error);
    res.status(500).json({ error: 'Failed to get today\'s workout' });
  }
});

// Save completed workout
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { date, workout, exercises } = req.body;
    
    console.log('📋 Workout data received:', {
      user: req.user.username,
      date: date,
      workoutName: workout?.name,
      exerciseCount: exercises?.length,
      timestamp: new Date().toISOString()
    });
    
    if (!date || !workout || !exercises) {
      return res.status(400).json({ error: 'Date, workout, and exercises are required' });
    }
    
    const workoutData = {
      workoutName: workout.name,
      exercises: exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets || [],
        notes: exercise.notes || ''
      }))
    };
    
    const savedWorkout = await database.saveWorkout(req.user.id, date, workoutData);
    
    res.json({
      message: 'Workout saved successfully',
      workout: savedWorkout
    });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ error: 'Failed to save workout' });
  }
});

// Get workout history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const workouts = await database.getWorkoutsByUser(req.user.id, limit);
    
    res.json({ workouts });
  } catch (error) {
    console.error('Error getting workout history:', error);
    res.status(500).json({ error: 'Failed to get workout history' });
  }
});

// Delete a workout by ID
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const { workoutId } = req.body;
    const userId = req.user.id;
    
    // Validate that workout ID is provided and is a number
    if (!workoutId || isNaN(workoutId)) {
      return res.status(400).json({ error: 'Valid workout ID is required' });
    }
    
    // Delete the workout from database
    const result = await database.deleteWorkout(parseInt(workoutId), userId);
    
    if (result.changesCount === 0) {
      return res.status(404).json({ error: 'Workout not found or already deleted' });
    }
    
    res.json({ 
      message: 'Workout deleted successfully',
      workoutId: result.workoutId 
    });
    
  } catch (error) {
    console.error('Error deleting workout:', error);
    
    // Handle specific error cases
    if (error.message === 'Workout not found or access denied') {
      return res.status(403).json({ error: 'Access denied or workout not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

module.exports = router;