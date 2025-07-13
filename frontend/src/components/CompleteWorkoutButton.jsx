import React from 'react';
import { Trophy } from 'lucide-react';

const CompleteWorkoutButton = ({
  onComplete,
  loading,
  completed,
  disabled = false,
  exerciseCount = 0,
}) => {
  // Don't show button if no exercises
  if (exerciseCount === 0) return null;

  const getButtonContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center">
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
    let baseClasses =
      'px-8 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

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
