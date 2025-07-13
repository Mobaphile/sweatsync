import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import logger from '../utils/logger.js';

// ExerciseTracker component with better validation and error handling
const ExerciseTracker = ({ exercise, onUpdate }) => {
  // Component state
  const [sets, setSets] = useState([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({}); // Track validation errors for individual sets
  const [isExpanded, setIsExpanded] = useState(true); // Allow collapsing

  // Clear errors for a specific set
  const clearSetError = index => {
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
    const newSet =
      exercise.type === 'reps'
        ? { reps: '', weight: '' }
        : { time: '', notes: '' };

    const newSets = [...sets, newSet];
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });

    logger.userAction('Added set to exercise', {
      exerciseName: exercise.name,
      setCount: newSets.length,
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
      value,
    });
  };

  // Remove a set
  const removeSet = index => {
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
    onUpdate(exercise.name, { sets: newSets, notes });

    // Clear any errors for this set
    clearSetError(index);

    logger.userAction('Removed set from exercise', {
      exerciseName: exercise.name,
      setCount: newSets.length,
    });
  };

  // Update notes
  const updateNotes = value => {
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
                  {
                    sets.filter(set =>
                      exercise.type === 'reps' ? set.reps : set.time
                    ).length
                  }{' '}
                  sets
                </span>
              )}
            </h3>
            <p className="text-gray-600">
              Target:{' '}
              {exercise.type === 'time'
                ? `${exercise.sets} sets × ${
                    exercise.target_time || 'time-based'
                  }`
                : `${exercise.sets} sets × ${
                    exercise.target_reps || 'reps'
                  } reps`}
            </p>
            {exercise.notes && (
              <p className="text-sm text-blue-600 mt-1 italic">
                {exercise.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
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
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
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
                        onChange={e => updateSet(index, 'reps', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.reps
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                        max="1000"
                      />
                      {errors[index]?.reps && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors[index].reps}
                        </p>
                      )}
                    </div>

                    {/* Weight input */}
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Weight (lbs)"
                        value={set.weight}
                        onChange={e =>
                          updateSet(index, 'weight', e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.weight
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                        step="0.5"
                      />
                      {errors[index]?.weight && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors[index].weight}
                        </p>
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
                        onChange={e => updateSet(index, 'time', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors[index]?.time
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min="0"
                      />
                      {errors[index]?.time && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors[index].time}
                        </p>
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
              onChange={e => updateNotes(e.target.value)}
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

export default ExerciseTracker;
