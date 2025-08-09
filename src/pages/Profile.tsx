import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { updateUser } from '../utils/firebase';

const Profile: React.FC = () => {
  const { userProfile, currentUser, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState(userProfile?.name || '');
  const [homeCourse, setHomeCourse] = useState(userProfile?.homeCourse || '');
  const [handicap, setHandicap] = useState(userProfile?.handicap?.toString() || '');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateUser(currentUser!.uid, {
        name: name.trim(),
        homeCourse: homeCourse.trim() || undefined,
        handicap: handicap ? parseFloat(handicap) : undefined
      });
      
      await refreshUserProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(userProfile?.name || '');
    setHomeCourse(userProfile?.homeCourse || '');
    setHandicap(userProfile?.handicap?.toString() || '');
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your profile and view your golf statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-4">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.name}
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-golf-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {userProfile?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Profile Photo</p>
                    <p className="text-sm text-gray-600">
                      {userProfile?.photoURL ? 'Connected via Google' : 'No photo uploaded'}
                    </p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="text-gray-900">{userProfile?.name}</p>
                  )}
                </div>

                {/* Home Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Course
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homeCourse}
                      onChange={(e) => setHomeCourse(e.target.value)}
                      className="input-field"
                      placeholder="Enter your home course"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {userProfile?.homeCourse || 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Handicap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Handicap
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="54"
                      value={handicap}
                      onChange={(e) => setHandicap(e.target.value)}
                      className="input-field"
                      placeholder="Enter your handicap"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {userProfile?.handicap ? `${userProfile.handicap}` : 'Not specified'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{currentUser?.email}</p>
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Rounds Played</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userProfile?.stats.roundsPlayed || 0}
                    </p>
                  </div>
                  <div className="text-3xl">🏌️</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-golf-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Wins</p>
                    <p className="text-2xl font-bold text-golf-green-600">
                      {userProfile?.stats.wins || 0}
                    </p>
                  </div>
                  <div className="text-3xl">🏆</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-golf-sand-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Birdies</p>
                    <p className="text-2xl font-bold text-golf-sand-600">
                      {userProfile?.stats.birdies || 0}
                    </p>
                  </div>
                  <div className="text-3xl">🐦</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Best Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {userProfile?.stats.bestScore === 999 ? 'N/A' : userProfile?.stats.bestScore}
                    </p>
                  </div>
                  <div className="text-3xl">🎯</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {userProfile?.stats.averageScore || 0}
                    </p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-semibold">
                    {userProfile?.stats.roundsPlayed 
                      ? `${Math.round((userProfile.stats.wins / userProfile.stats.roundsPlayed) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Birdies per Round</span>
                  <span className="font-semibold">
                    {userProfile?.stats.roundsPlayed 
                      ? (userProfile.stats.birdies / userProfile.stats.roundsPlayed).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">
                    {currentUser?.metadata.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
