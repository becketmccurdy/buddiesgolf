import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { getRounds, getAllUsers, Round, User } from '../utils/firebase';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [rounds, users] = await Promise.all([
          getRounds(5),
          getAllUsers()
        ]);
        setRecentRounds(rounds);
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const getLeaderboard = () => {
    return allUsers
      .sort((a, b) => b.stats.wins - a.stats.wins)
      .slice(0, 5);
  };

  const getPlayerName = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.name || 'Unknown Player';
  };

  const getPlayerPhoto = (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    return user?.photoURL;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getWinRate = () => {
    if (!userProfile?.stats.roundsPlayed) return 0;
    return Math.round((userProfile.stats.wins / userProfile.stats.roundsPlayed) * 100);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🏌️</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, {userProfile?.name || 'Golfer'}!
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Ready to dominate the course today?
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/new-round"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <span className="text-xl">🏌️</span>
                  <span>Start New Round</span>
                </Link>
                <Link
                  to="/history"
                  className="w-full bg-white border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-xl">📊</span>
                  <span>View History</span>
                </Link>
                <Link
                  to="/profile"
                  className="w-full bg-white border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-xl">👤</span>
                  <span>Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Your Stats */}
            <div className="card hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Your Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">🏌️</span>
                    <span className="text-gray-700">Rounds Played</span>
                  </div>
                  <span className="font-bold text-blue-600 text-lg">{userProfile?.stats.roundsPlayed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🏆</span>
                    <span className="text-gray-700">Wins</span>
                  </div>
                  <span className="font-bold text-green-600 text-lg">{userProfile?.stats.wins || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600">🎯</span>
                    <span className="text-gray-700">Best Score</span>
                  </div>
                  <span className="font-bold text-purple-600 text-lg">
                    {userProfile?.stats.bestScore === 999 ? 'N/A' : userProfile?.stats.bestScore}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">📊</span>
                    <span className="text-gray-700">Average Score</span>
                  </div>
                  <span className="font-bold text-orange-600 text-lg">{userProfile?.stats.averageScore || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600">🐦</span>
                    <span className="text-gray-700">Birdies</span>
                  </div>
                  <span className="font-bold text-yellow-600 text-lg">{userProfile?.stats.birdies || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">📈</span>
                    <span className="text-gray-700">Win Rate</span>
                  </div>
                  <span className="font-bold text-red-600 text-lg">{getWinRate()}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Rounds & Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Rounds */}
            <div className="card hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">⏰</span>
                  Recent Rounds
                </h2>
                <Link
                  to="/history"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {recentRounds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🏌️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No rounds played yet</h3>
                  <p className="text-gray-500 mb-6">Start your golf journey by recording your first round!</p>
                  <Link
                    to="/new-round"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <span className="mr-2">🚀</span>
                    Start Your First Round
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRounds.map((round, index) => (
                    <div
                      key={round.id}
                      className="border border-gray-200 rounded-xl p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{round.course}</h3>
                            {index === 0 && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{formatDate(round.date)}</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {round.players.length} player{round.players.length !== 1 ? 's' : ''} • {round.scores[0]?.holes.length || 18} holes
                          </p>
                        </div>
                        {round.winner && (
                          <div className="text-right">
                            <span className="text-xs text-gray-500 font-medium">Winner</span>
                            <div className="flex items-center space-x-2 mt-1">
                              {getPlayerPhoto(round.winner) ? (
                                <img
                                  src={getPlayerPhoto(round.winner)}
                                  alt={getPlayerName(round.winner)}
                                  className="w-8 h-8 rounded-full border-2 border-green-200"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center border-2 border-green-200">
                                  <span className="text-white text-sm font-bold">
                                    {getPlayerName(round.winner).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm font-semibold text-green-600">
                                {getPlayerName(round.winner)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="card hover:shadow-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">🏆</span>
                Leaderboard
              </h2>
              
              {allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-gray-500">No players yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getLeaderboard().map((user, index) => (
                    <div
                      key={user.uid}
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 transition-all duration-200"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="flex items-center space-x-3 flex-1">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-gray-200">
                            <span className="text-gray-600 text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-gray-900">{user.name}</span>
                          <p className="text-xs text-gray-500">{user.stats.roundsPlayed} rounds played</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {user.stats.wins} wins
                        </div>
                        <div className="text-xs text-gray-500">
                          {getWinRate()}% win rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
