import React from 'react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../utils/firebase';
import { getUserRole } from '../../utils/userManagement';
import LoadingScreen from '../layouts/LoadingScreen';

function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { role } = await getUserRole(user.uid);
        setIsAdmin(role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute; 