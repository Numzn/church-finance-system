import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './utils/firebase';
import App from './App';
import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';
import './styles/landing.css';

const AppWrapper = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/*" element={<App />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
};

export default AppWrapper; 