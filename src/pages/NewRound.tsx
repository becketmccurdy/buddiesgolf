import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ScoreInput from '../components/ScoreInput';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, createRound, User } from '../utils/firebase';
import LoadingSpinner from '../components/LoadingSpinner';

const NewRound: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [courseName, setCourseName] = useState('');
  const [roundDate, setRoundDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [holeCount, setHoleCount] = useState(18);
  const [scores, setScores] = useState<{ [uid: string]: number[] }>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null);
        const users = await getAllUsers();
        setAllUsers(users);
        
        // Initialize scores for all users
        const initialScores: { [uid: string]: number[] } = {};
        users.forEach(user => {
          initialScores[user.uid] = new Array(holeCount).fill(0);
        });
        setScores(initialScores);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [holeCount]);

  const handlePlayerToggle = (uid: string) => {
    setSelectedPlayers(prev => 
      prev.includes(uid) 
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const handleScoreChange = (uid: string, holeIndex: number, score: number) => {
    setScores(prev => ({
      ...prev,
      [uid]: prev[uid].map((s, i) => i === holeIndex ? score : s)
    }));
  };

  const calculateTotalScore = (uid: string) => {
    return scores[uid]?.reduce((sum, score) => sum + (score || 0), 0) || 0;
  };

  const getWinner = () => {
    const playerScores = selectedPlayers.map(uid => ({
      uid,
      total: calculateTotalScore(uid)
    }));
    
    return playerScores.reduce((winner, current) => 
      current.total < winner.total ? current : winner
    );
  };

  const validateForm = () => {
    if (!courseName.trim()) {
      setError('Please enter a course name');
      return false;
    }
    
    if (selectedPlayers.length < 2) {
      setError('Please select at least 2 players');
      return false;
    }

    // Validate all scores are entered
    const hasIncompleteScores = selectedPlayers.some(uid => 
      scores[uid].some(score => score === 0)
    );
    
    if (hasIncompleteScores) {
      setError('Please fill in all scores for selected players');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const winner = getWinner();
      const roundData = {
        course: courseName.trim(),
        date: roundDate,
        players: selectedPlayers,
        scores: selectedPlayers.map(uid => ({
          uid,
          holes: scores[uid]
        })),
        winner: winner.uid
      };

      await createRound(roundData);
      navigate('/');
    } catch (error) {
      console.error('Error creating round:', error);
      setError('Failed to save round. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPlayerName = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.name || 'Unknown Player';
  };

  const getPlayerPhoto = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.photoURL;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🏌️</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                New Round
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Record a new golf round with your buddies
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="card hover:shadow-lg transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📋</span>
              Round Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  id="course"
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g., Pebble Beach Golf Links"
                  className="input-field focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={roundDate}
                  onChange={(e) => setRoundDate(e.target.value)}
                  className="input-field focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="holes" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Holes
                </label>
                <select
                  id="holes"
                  value={holeCount}
                  onChange={(e) => setHoleCount(parseInt(e.target.value))}
                  className="input-field focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={9}>9 Holes</option>
                  <option value={18}>18 Holes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="card hover:shadow-lg transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">👥</span>
              Select Players
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allUsers.map(user => (
                <button
                  key={user.uid}
                  type="button"
                  onClick={() => handlePlayerToggle(user.uid)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedPlayers.includes(user.uid)
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-gray-600 font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 text-center">
                      {user.name}
                    </span>
                    {selectedPlayers.includes(user.uid) && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedPlayers.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Selected: {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Scoring */}
          {selectedPlayers.length >= 2 && (
            <div className="card hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">📊</span>
                Scorecard
              </h2>
              
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-32"></div>
                      {selectedPlayers.map(uid => {
                        const user = allUsers.find(u => u.uid === uid);
                        return (
                          <div key={uid} className="flex items-center space-x-3">
                            {user?.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-gray-200">
                                <span className="text-gray-600 text-sm font-bold">
                                  {user?.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 min-w-0 truncate">
                              {user?.name}
                            </span>
                          </div>
                        );
                      })}
                      <div className="w-20 text-center text-sm font-medium text-gray-700">
                        Total
                      </div>
                    </div>
                  </div>

                  {/* Score inputs */}
                  <div className="space-y-4">
                    {Array.from({ length: holeCount }, (_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-32 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          Hole {i + 1}
                        </div>
                        {selectedPlayers.map(uid => (
                          <div key={uid} className="flex justify-center">
                            <ScoreInput
                              value={scores[uid]?.[i] || 0}
                              onChange={(score) => handleScoreChange(uid, i, score)}
                              holeNumber={i + 1}
                            />
                          </div>
                        ))}
                        <div className="w-20"></div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="flex items-center space-x-4 mt-8 pt-6 border-t-2 border-gray-200">
                    <div className="w-32 text-lg font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                      Total
                    </div>
                    {selectedPlayers.map(uid => (
                      <div key={uid} className="flex justify-center">
                        <div className="text-xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                          {calculateTotalScore(uid)}
                        </div>
                      </div>
                    ))}
                    <div className="w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || selectedPlayers.length < 2}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>💾</span>
                  <span>Save Round</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRound;
