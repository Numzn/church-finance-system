import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_BEFORE_TIMEOUT = 60 * 1000; // Show warning 1 minute before logout

export function useAutoLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  const handleUserActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [navigate]);

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Check for inactivity
    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity >= ACTIVITY_TIMEOUT) {
        handleLogout();
      } else if (timeSinceLastActivity >= ACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT) {
        setShowWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(checkInactivity);
    };
  }, [handleUserActivity, handleLogout, lastActivity]);

  return {
    showWarning,
    resetTimer,
    handleLogout
  };
} 