import React, { useState } from 'react';

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  holeNumber: number;
  disabled?: boolean;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ value, onChange, holeNumber, disabled = false }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (newValue >= 1 && newValue <= 10) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (value < 10) {
        onChange(value + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (value > 1) {
        onChange(value - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 1) return 'bg-green-100 text-green-800 border-green-300'; // Hole in one
    if (score === 2) return 'bg-blue-100 text-blue-800 border-blue-300'; // Eagle
    if (score === 3) return 'bg-purple-100 text-purple-800 border-purple-300'; // Birdie
    if (score === 4) return 'bg-gray-100 text-gray-800 border-gray-300'; // Par
    if (score === 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Bogey
    if (score >= 6) return 'bg-red-100 text-red-800 border-red-300'; // Double bogey or worse
    return 'bg-gray-50 text-gray-500 border-gray-200'; // Empty
  };

  const getScoreLabel = (score: number) => {
    if (score === 1) return 'Hole in One!';
    if (score === 2) return 'Eagle';
    if (score === 3) return 'Birdie';
    if (score === 4) return 'Par';
    if (score === 5) return 'Bogey';
    if (score >= 6) return 'Double+';
    return '';
  };

  return (
    <div className="flex flex-col items-center space-y-1 relative group">
      <label className="text-xs text-gray-500 font-medium">
        {holeNumber}
      </label>
      <div className="relative">
        <input
          type="number"
          min="1"
          max="10"
          value={value || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`w-14 h-14 text-center border-2 rounded-lg font-bold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            value ? getScoreColor(value) : 'bg-gray-50 text-gray-500 border-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-300'} ${
            isFocused ? 'transform scale-105 shadow-lg' : ''
          }`}
          placeholder="-"
          aria-label={`Score for hole ${holeNumber}`}
        />
        {value && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {getScoreLabel(value)}
          </div>
        )}
      </div>
      {/* Quick increment/decrement buttons */}
      {!disabled && (
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => value > 1 && onChange(value - 1)}
            disabled={value <= 1}
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Decrease score for hole ${holeNumber}`}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => value < 10 && onChange(value + 1)}
            disabled={value >= 10}
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Increase score for hole ${holeNumber}`}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreInput;
