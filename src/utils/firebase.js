import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import toast from 'react-hot-toast';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAV4B0ScFA5I0aSJ0KFehf0tuJJgAuCFkg",
  authDomain: "churchnumz.firebaseapp.com",
  projectId: "churchnumz",
  storageBucket: "churchnumz.firebasestorage.app",
  messagingSenderId: "804372189474",
  appId: "1:804372189474:web:098b523bf214797e22d57b",
  measurementId: "G-MB45CDN67S"
};

// Initialize Firebase with error handling
let app;
try {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  toast.error('Error connecting to the database. Please check your internet connection and try again.');
  throw error;
}

// Initialize services with error handling
let auth, db, storage, analytics;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
  console.log('Firebase services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase services:', error);
  toast.error('Error initializing application services. Please try again later.');
  throw error;
}

// Set auth persistence to session
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Auth persistence set to session successfully');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
    toast.error('Error setting up authentication. Please try again later.');
  });

export { auth, db, storage, analytics }; 