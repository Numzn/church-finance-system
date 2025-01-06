import React from 'react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../utils/firebase';
import LoadingScreen from '../layouts/LoadingScreen';

function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute; 