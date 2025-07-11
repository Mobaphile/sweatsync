const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current workout plan
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    const planPath = path.join(__dirname, '../workout-plans/current-plan.json');
    const planData = await fs.readFile(planPath, 'utf8');
    const plan = JSON.parse(planData);
    
    res.json({ plan });
  } catch (error) {
    console.error('Error loading workout plan:', error);
    res.status(500).json({ error: 'Failed to load workout plan' });
  }
});

// Get today's workout
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const planPath = path.join(__dirname, '../workout-plans/current-plan.json');
    const planData = await fs.readFile(planPath, 'utf8');
    const plan = JSON.parse(planData);
    
    const todaysWorkout = plan.schedule[dayName];
    
    if (!todaysWorkout) {
      return res.json({ 
        message: 'No workout scheduled for today',
        date: today.toISOString().split('T')[0]
      });
    }
    
    res.json({
      date: today.toISOString().split('T')[0],
      workout: todaysWorkout
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

module.exports = router;