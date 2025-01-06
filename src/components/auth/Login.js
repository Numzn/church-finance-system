import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../utils/firebase';
import toast from 'react-hot-toast';
import LoadingScreen from '../layouts/LoadingScreen';
import RegistrationDialog from './RegistrationDialog';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [systemEmail, setSystemEmail] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Network connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // System Registration Check
  useEffect(() => {
    console.log('Checking registration status...');
    const checkRegistration = async () => {
      setVerificationLoading(true);
      try {
        // Get the system owner document
        const docRef = doc(db, 'systemOwners', 'P6Zxam9NUxwmB1iOWjEQ');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSystemEmail(data.email);
          const storedEmail = localStorage.getItem('registeredEmail');
          
          if (storedEmail) {
            if (data.email.toLowerCase() === storedEmail.toLowerCase()) {
              console.log('Stored email matches the database email.');
              setIsRegistered(true);
              setRegistrationOpen(false);
            } else {
              console.log('Stored email does not match. Prompting verification dialog.');
              setRegistrationOpen(true);
            }
          } else {
            console.log('No stored email found. Opening verification dialog.');
            setRegistrationOpen(true);
          }
        } else {
          console.log('Registration not found. Opening registration dialog.');
          setRegistrationOpen(true);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        toast.error('Failed to verify system registration.');
        setRegistrationOpen(true);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkRegistration();
  }, []);

  const handleRegistrationClose = () => {
    console.log('Registration verified. Closing dialog.');
    setIsRegistered(true);
    setRegistrationOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }

    if (!isRegistered) {
      toast.error('Please verify system registration first.');
      setRegistrationOpen(true);
      return;
    }

    setLoading(true);

    try {
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      await Promise.race([loginPromise, timeoutPromise]);
      toast.success('Logged in successfully');
    } catch (error) {
      setLoading(false);
      
      switch (error.code) {
        case 'auth/network-request-failed':
          toast.error('Network error. Please check your internet connection and try again.');
          break;
        case 'auth/user-not-found':
          toast.error('No account found with this email.');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password.');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.');
          break;
        default:
          if (error.message === 'Request timeout') {
            toast.error('Connection is too slow. Please try again.');
          } else {
            toast.error('Login failed. Please try again.');
            console.error('Login error:', error);
          }
      }
    }
  };

  if (loading || verificationLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-0">
        <div className="absolute inset-0 bg-grid-primary-700/[0.05] dark:bg-grid-white/[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-100/30 to-primary-100/80 dark:from-transparent dark:via-gray-900/30 dark:to-gray-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 transform -translate-y-16 animate-float">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-lg sm:px-10 border border-white/20 dark:border-gray-700/50 hover:shadow-3xl transition-shadow duration-300">
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Sign in to System
            </h3>
            {systemEmail && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Registered to: {systemEmail}
              </p>
            )}
          </div>

          {!isOnline && (
            <div className="mb-4 p-3 bg-red-100/80 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 rounded backdrop-blur-sm">
              You are currently offline. Please check your internet connection.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isOnline || loading || !isRegistered}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600/90 hover:bg-primary-700/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800 backdrop-blur-sm transition-colors duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Registration Dialog */}
      <RegistrationDialog 
        isOpen={registrationOpen} 
        onClose={handleRegistrationClose}
      />
    </div>
  );
}

export default Login; 