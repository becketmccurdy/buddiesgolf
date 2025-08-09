import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { getRounds, getAllUsers, Round, User } from '../utils/firebase';
import LoadingSpinner from '../components/LoadingSpinner';

const RoundHistory: React.FC = () => {
  const { userProfile } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredRounds, setFilteredRounds] = useState<Round[]>([]);
  
  // Filters
  const [courseFilter, setCourseFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roundsData, usersData] = await Promise.all([
          getRounds(50), // Get more rounds for history
          getAllUsers()
        ]);
        setRounds(roundsData);
        setAllUsers(usersData);
      } catch (error) {
        console.error('Error fetching history data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = rounds;

    if (courseFilter) {
      filtered = filtered.filter(round => 
        round.course.toLowerCase().includes(courseFilter.toLowerCase())
      );
    }

    if (playerFilter) {
      const targetUser = allUsers.find(user => 
        user.name.toLowerCase().includes(playerFilter.toLowerCase())
      );
      if (targetUser) {
        filtered = filtered.filter(round => 
          round.players.includes(targetUser.uid)
        );
      }
    }

    if (dateFilter) {
      filtered = filtered.filter(round => 
        round.date === dateFilter
      );
    }

    setFilteredRounds(filtered);
  }, [rounds, allUsers, courseFilter, playerFilter, dateFilter]);

  const getPlayerName = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.name || 'Unknown Player';
  };

  const getPlayerPhoto = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.photoURL;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlayerScore = (round: Round, uid: string) => {
    const playerScore = round.scores.find(s => s.uid === uid);
    return playerScore ? playerScore.holes.reduce((sum, score) => sum + score, 0) : 0;
  };

  const getUniqueCourses = () => {
    return [...new Set(rounds.map(round => round.course))];
  };

  const getUniqueDates = () => {
    return [...new Set(rounds.map(round => round.date))].sort().reverse();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Round History
          </h1>
          <p className="text-gray-600 mt-2">
            View and filter your past golf rounds
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                id="course-filter"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Courses</option>
                {getUniqueCourses().map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="player-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Player
              </label>
              <input
                id="player-filter"
                type="text"
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value)}
                placeholder="Search by player name"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Dates</option>
                {getUniqueDates().map(date => (
                  <option key={date} value={date}>{formatDate(date)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rounds List */}
        <div className="space-y-6">
          {filteredRounds.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🏌️</div>
              <p className="text-gray-500 text-lg">
                {rounds.length === 0 ? 'No rounds played yet' : 'No rounds match your filters'}
              </p>
            </div>
          ) : (
            filteredRounds.map((round) => (
              <div key={round.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {round.course}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(round.date)} • {round.players.length} players
                    </p>
                  </div>
                  {round.winner && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Winner</span>
                      <div className="flex items-center space-x-1">
                        {getPlayerPhoto(round.winner) ? (
                          <img
                            src={getPlayerPhoto(round.winner)}
                            alt={getPlayerName(round.winner)}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-golf-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {getPlayerName(round.winner).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-golf-green-600">
                          {getPlayerName(round.winner)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scorecard */}
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    {/* Header */}
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-32"></div>
                        {round.players.map(uid => (
                          <div key={uid} className="flex items-center space-x-2">
                            {getPlayerPhoto(uid) ? (
                              <img
                                src={getPlayerPhoto(uid)}
                                alt={getPlayerName(uid)}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs font-medium">
                                  {getPlayerName(uid).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 min-w-0 truncate">
                              {getPlayerName(uid)}
                            </span>
                          </div>
                        ))}
                        <div className="w-16 text-center text-sm font-medium text-gray-700">
                          Total
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-2">
                      {Array.from({ length: round.scores[0]?.holes.length || 0 }, (_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="w-32 text-sm text-gray-600">
                            Hole {i + 1}
                          </div>
                          {round.players.map(uid => {
                            const playerScore = round.scores.find(s => s.uid === uid);
                            const score = playerScore?.holes[i] || 0;
                            return (
                              <div key={uid} className="flex justify-center">
                                <div className="w-12 h-12 flex items-center justify-center text-sm font-medium">
                                  {score}
                                </div>
                              </div>
                            );
                          })}
                          <div className="w-16"></div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="w-32 text-sm font-bold text-gray-900">
                        Total
                      </div>
                      {round.players.map(uid => (
                        <div key={uid} className="flex justify-center">
                          <div className="text-lg font-bold text-golf-green-600">
                            {getPlayerScore(round, uid)}
                          </div>
                        </div>
                      ))}
                      <div className="w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundHistory;
