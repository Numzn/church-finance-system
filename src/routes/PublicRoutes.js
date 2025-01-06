import React from 'react';
import { Navigate } from 'react-router-dom';
import LandingPage from '../components/landing/LandingPage';
import Login from '../components/auth/Login';

const PublicRoutes = ({ path }) => {
  switch (path) {
    case '/':
      return <LandingPage />;
    case '/login':
      return <Login />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default PublicRoutes; 