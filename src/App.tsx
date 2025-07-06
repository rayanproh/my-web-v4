import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingSpinner } from './components/Loading/LoadingSpinner';
import { ProfileSetup } from './components/Onboarding/ProfileSetup';

// Lazy load components for better performance
const AuthPage = lazy(() => import('./pages/AuthPage').then(module => ({ default: module.AuthPage })));
const MainLayout = lazy(() => import('./components/Layout/MainLayout').then(module => ({ default: module.MainLayout })));

const AppContent: React.FC = () => {
  const { user, userData, loading, needsProfileSetup } = useAuthContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show profile setup for new users
  if (user && needsProfileSetup) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={!user ? (
            <Suspense fallback={<LoadingSpinner />}>
              <AuthPage />
            </Suspense>
          ) : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={user && userData ? (
            <Suspense fallback={<LoadingSpinner />}>
              <MainLayout />
            </Suspense>
          ) : <Navigate to="/auth" replace />} 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;