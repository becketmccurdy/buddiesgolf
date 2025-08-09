import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CourseContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewRound from './pages/NewRound';
import RoundHistory from './pages/RoundHistory';
import Profile from './pages/Profile';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseForm from './components/CourseForm';
import LoadingSpinner from './components/LoadingSpinner';
import OnboardingTour from './components/OnboardingTour';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/new-round" 
        element={
          <ProtectedRoute>
            <NewRound />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <RoundHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/new" 
        element={
          <ProtectedRoute>
            <CourseForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:courseId" 
        element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/edit/:courseId" 
        element={
          <ProtectedRoute>
            <CourseForm isEdit={true} />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    setShowTour(!hasSeenTour);
  }, []);

  const handleTourEnd = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShowTour(false);
  };

  return (
    <AuthProvider>
      <CourseProvider>
        <div className="min-h-screen bg-gray-50">
          <OnboardingTour show={showTour} onEnd={handleTourEnd} />
          <AppRoutes />
        </div>
      </CourseProvider>
    </AuthProvider>
  );
};

export default App;
