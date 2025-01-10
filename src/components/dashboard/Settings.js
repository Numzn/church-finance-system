import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { isUserAdmin } from '../../utils/userManagement';

function Settings() {
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        try {
          // Check user document
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          console.log('User document:', userDoc.data());

          // If user has admin role but not in admins collection, add them
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            const adminRef = doc(db, 'admins', auth.currentUser.uid);
            const adminDoc = await getDoc(adminRef);
            
            if (!adminDoc.exists()) {
              console.log('Adding user to admins collection...');
              try {
                await setDoc(adminRef, {
                  email: auth.currentUser.email,
                  createdAt: new Date().toISOString()
                });
                console.log('Successfully added to admins collection');
                toast.success('Admin permissions granted');
              } catch (error) {
                console.error('Error adding to admins collection:', error);
                toast.error('Failed to grant admin permissions');
              }
            }
          }

          // Check admin document again
          const adminRef = doc(db, 'admins', auth.currentUser.uid);
          const adminDoc = await getDoc(adminRef);
          console.log('Admin document exists:', adminDoc.exists());

          const adminStatus = await isUserAdmin(auth.currentUser.uid);
          console.log('Final admin status:', adminStatus);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          toast.error('Error checking permissions');
        }
      }
    };
    checkAdminStatus();
  }, []);

  const generateBackupFile = async () => {
    setProgress('Fetching data...');
    try {
      if (!isAdmin) {
        throw new Error('Insufficient permissions. Admin access required.');
      }

      // Fetch all collections data
      const collections = ['submissions', 'members', 'emailReplies'];
      const backupData = {};

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        backupData[collectionName] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to dates
          if (data.date && typeof data.date.toDate === 'function') {
            data.date = data.date.toDate();
          }
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate();
          }
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            data.timestamp = data.timestamp.toDate();
          }
          return {
            id: doc.id,
            ...data
          };
        });
      }

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Create submissions sheet
      if (backupData.submissions && backupData.submissions.length > 0) {
        try {
          const submissionsData = backupData.submissions.map(item => ({
            Date: item.date ? formatDate(item.date) : '',
            'Member Name': item.memberName || '',
            Tithe: item.tithe ? formatCurrency(item.tithe) : '0',
            Offering: item.offering ? formatCurrency(item.offering) : '0',
            'Week Number': item.weekNumber || '',
            'Created At': item.createdAt ? formatDate(item.createdAt) : '',
          }));
          const wsSubmissions = XLSX.utils.json_to_sheet(submissionsData);
          XLSX.utils.book_append_sheet(wb, wsSubmissions, 'Submissions');
        } catch (error) {
          console.error('Error processing submissions:', error);
        }
      }

      // Create members sheet
      if (backupData.members && backupData.members.length > 0) {
        try {
          const membersData = backupData.members.map(item => ({
            'First Name': item.firstName || '',
            'Last Name': item.lastName || '',
            'Email': item.email || '',
            'Phone': item.phone || '',
            'Address': item.address || '',
            'Created At': item.createdAt ? formatDate(item.createdAt) : '',
          }));
          const wsMembers = XLSX.utils.json_to_sheet(membersData);
          XLSX.utils.book_append_sheet(wb, wsMembers, 'Members');
        } catch (error) {
          console.error('Error processing members:', error);
        }
      }

      // Create email replies sheet
      if (backupData.emailReplies && backupData.emailReplies.length > 0) {
        try {
          const repliesData = backupData.emailReplies.map(item => ({
            'From': item.from || '',
            'Subject': item.subject || '',
            'Message': item.message || '',
            'Date': item.timestamp ? formatDate(item.timestamp) : '',
            'Read': item.read ? 'Yes' : 'No',
          }));
          const wsReplies = XLSX.utils.json_to_sheet(repliesData);
          XLSX.utils.book_append_sheet(wb, wsReplies, 'Email Replies');
        } catch (error) {
          console.error('Error processing email replies:', error);
        }
      }

      // Check if any sheets were created
      if (wb.SheetNames.length === 0) {
        toast.success('No data to backup');
        return true;
      }

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `system_backup_${timestamp}.xlsx`;

      // Save file locally
      setProgress('Saving backup file...');
      XLSX.writeFile(wb, fileName);
      toast.success('Backup file saved to downloads folder');
      return true;
    } catch (error) {
      console.error('Error generating backup:', error);
      toast.error(error.message || 'Failed to generate backup file. Please try again.');
      return false;
    }
  };

  const clearDatabase = async () => {
    if (!isAdmin) {
      toast.error('Insufficient permissions. Admin access required.');
      return;
    }

    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    setProgress('Clearing database...');
    try {
      const collections = ['submissions', 'members', 'emailReplies'];
      const batch = writeBatch(db);
      let totalDeleted = 0;

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach((document) => {
          batch.delete(doc(db, collectionName, document.id));
          totalDeleted++;
        });
      }

      if (totalDeleted === 0) {
        toast.success('No records to clear');
        return;
      }

      await batch.commit();
      toast.success(`Successfully cleared ${totalDeleted} records`);
      setConfirmText(''); // Reset confirmation text
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Failed to clear database. Please try again.');
      throw error;
    }
  };

  const handleSystemReset = async () => {
    if (!isAdmin) {
      toast.error('Insufficient permissions. Admin access required.');
      return;
    }
    setShowWarning(true);
  };

  const handleConfirmReset = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    setShowWarning(false);
    setIsClearing(true);
    try {
      // Generate backup file
      const backupSuccess = await generateBackupFile();
      if (!backupSuccess) {
        throw new Error('Backup failed');
      }

      // Clear database
      await clearDatabase();

      toast.success('System reset completed successfully. Backup file has been saved to your downloads folder.');
      setConfirmText(''); // Reset confirmation text
    } catch (error) {
      console.error('Error during system reset:', error);
      toast.error('System reset failed');
    } finally {
      setIsClearing(false);
      setProgress('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 dark:text-red-400">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary">Clear Base</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-fg-alt">
          Reset the entire system and clear all data.
        </p>
      </div>

      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary">System Reset</h3>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSystemReset}
                  disabled={isClearing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  {isClearing ? progress || 'Processing...' : 'Reset System'}
                </button>
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-fg-alt">
                  Reset the entire system. This will generate a backup file before clearing all data.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      <Transition.Root show={showWarning} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowWarning}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-bg-secondary px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 pr-4 pt-4 block">
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-dark-bg-secondary text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={() => setShowWarning(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-fg-primary">
                        Warning: System Reset
                      </Dialog.Title>
                      <div className="mt-2">
                        <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-4">
                          <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            This will completely reset the system and delete all data. A backup Excel file will be generated and saved to your downloads folder before deletion.
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          To confirm, please type &quot;DELETE ALL DATA&quot; in the field below:
                        </p>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="Type DELETE ALL DATA"
                        />
                        <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleConfirmReset}
                      disabled={isClearing || confirmText !== 'DELETE ALL DATA'}
                    >
                      {isClearing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Reset System'
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                      onClick={() => setShowWarning(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}

export default Settings; 