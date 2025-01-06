import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

function RegistrationDialog({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerification = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      const docRef = doc(db, 'systemOwners', 'P6Zxam9NUxwmB1iOWjEQ');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.email.toLowerCase() === email.toLowerCase()) {
          // Success - store email and close dialog
          localStorage.setItem('registeredEmail', data.email);
          setEmail('');
          onClose();
        } else {
          setError('Invalid system registration email.');
        }
      } else {
        setError('System registration not found.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify registration. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />

        {/* Center modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                System Registration Verification
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please enter your system registration email to verify access.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleVerification} className="mt-5 sm:mt-6">
            <div>
              <label htmlFor="verification-email" className="sr-only">
                Registration Email
              </label>
              <input
                type="email"
                id="verification-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter registration email"
                required
              />
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-5 sm:mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={verifying}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistrationDialog; 