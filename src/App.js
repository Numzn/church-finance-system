import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import Dashboard from './components/dashboard/Dashboard';
import Members from './components/dashboard/Members';
import Reports from './components/dashboard/Reports';
import Receipts from './components/dashboard/Receipts';
import Users from './components/admin/Users';
import BroadcastEmail from './components/dashboard/BroadcastEmail';
import Settings from './components/dashboard/Settings';
import FinancialForm from './components/dashboard/FinancialForm';
import DashboardLayout from './components/layouts/DashboardLayout';
import PrivateRoute from './components/auth/PrivateRoute';
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
        <Route path="members" element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="financial-form" element={<PrivateRoute><FinancialForm /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="broadcast" element={<PrivateRoute><BroadcastEmail /></PrivateRoute>} />
        <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App; 