import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ScoreInput from '../components/ScoreInput';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../contexts/CourseContext';
import { getAllUsers, createRound, User } from '../utils/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Course } from '../utils/firebase';

const NewRound: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Course selection state
  const [searchParams] = useSearchParams();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [query, setQuery] = useState('');
  
  // Form state
  const [roundDate, setRoundDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [holeCount, setHoleCount] = useState(18);
  const [scores, setScores] = useState<{ [uid: string]: number[] }>({});
  
  // Set initial course from URL params if provided
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    if (courseId && courses.length > 0) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        setHoleCount(course.holes || 18);
      }
    }
  }, [searchParams, courses]);

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

  const validateForm = (): boolean => {
    if (!selectedCourse) {
      setError('Please select a course');
      return false;
    }
    
    if (selectedPlayers.length < 1) {
      setError('Please select at least one player');
      return false;
    }
    
    // Validate scores
    for (const uid of selectedPlayers) {
      if (!scores[uid] || scores[uid].length === 0) {
        setError('Please enter scores for all selected players');
        return false;
      }
      
      // Check for any unset scores (0 is a valid score)
      if (scores[uid].some(score => score === null || score === undefined)) {
        setError('Please enter a valid score for all holes');
        return false;
      }
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
        courseId: selectedCourse.id!,
        courseName: selectedCourse.name,
        course: selectedCourse,
        date: roundDate,
        players: selectedPlayers,
        scores: selectedPlayers.map(uid => ({
          uid,
          holes: scores[uid]
        })),
        winner: winner.uid,
        holeCount: selectedCourse.holes || 18,
        par: selectedCourse.par || 72,
        location: selectedCourse.location
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

  // Filter courses based on search query
  const filteredCourses = query === ''
    ? courses
    : courses.filter((course) => {
        return course.name.toLowerCase().includes(query.toLowerCase()) ||
               (course.location?.address && course.location.address.toLowerCase().includes(query.toLowerCase()));
      });

  if (loading || coursesLoading) {
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
          {/* Course Selection */}
          <div className="card hover:shadow-lg transition-all duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🏌️</span>
              Course Selection
            </h2>
            
            <div className="mb-6">
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Select Course <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Combobox value={selectedCourse} onChange={setSelectedCourse}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-green-300 sm:text-sm">
                      <Combobox.Input
                        className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        displayValue={(course: Course) => course?.name || ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search courses..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                      {filteredCourses.length === 0 && query !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          No courses found. <button
                            type="button"
                            onClick={() => navigate('/courses/new')}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Add new course
                          </button>
                        </div>
                      ) : (
                        filteredCourses.map((course) => (
                          <Combobox.Option
                            key={course.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-green-100 text-green-900' : 'text-gray-900'
                              }`
                            }
                            value={course}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {course.name}
                                  {course.location?.address && (
                                    <span className="text-xs text-gray-500 block truncate">
                                      {course.location.address}
                                    </span>
                                  )}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/courses/new')}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    + Add New Course
                  </button>
                </div>
              </div>
              
              {selectedCourse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedCourse.name}</h3>
                      {selectedCourse.location?.address && (
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedCourse.location.address}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/${selectedCourse.id}`)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      View Details
                    </button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Holes:</span>{' '}
                      <span className="font-medium">{selectedCourse.holes || 18}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Par:</span>{' '}
                      <span className="font-medium">{selectedCourse.par || 72}</span>
                    </div>
                    {selectedCourse.rating && (
                      <div>
                        <span className="text-gray-500">Rating:</span>{' '}
                        <span className="font-medium">{selectedCourse.rating}</span>
                      </div>
                    )}
                    {selectedCourse.slope && (
                      <div>
                        <span className="text-gray-500">Slope:</span>{' '}
                        <span className="font-medium">{selectedCourse.slope}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={roundDate}
                  onChange={(e) => setRoundDate(e.target.value)}
                  className="input-field focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holes <span className="text-red-500">*</span>
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
          {selectedPlayers.length >= 1 && (
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
              disabled={saving || selectedPlayers.length < 1}
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
