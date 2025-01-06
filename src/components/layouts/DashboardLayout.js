import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { auth, db } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import AutoLogoutWarning from '../auth/AutoLogoutWarning';
import { useAutoLogout } from '../../hooks/useAutoLogout';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Members', href: '/members', icon: UsersIcon },
  { name: 'Financial Form', href: '/financial-form', icon: CurrencyDollarIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'Receipts', href: '/receipts', icon: ReceiptRefundIcon },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
  { name: 'Broadcast Email', href: '/broadcast', icon: EnvelopeIcon },
];

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const membersFileInputRef = useRef(null);
  const submissionsFileInputRef = useRef(null);
  const { showWarning, resetTimer, handleLogout } = useAutoLogout();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserInfo({
              ...userDoc.data(),
              email: auth.currentUser.email
            });
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleFileUpload = async (event, type) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast.error('No data found in the uploaded file');
            return;
          }

          let successCount = 0;
          const errors = [];

          if (type === 'members') {
            for (const row of jsonData) {
              try {
                await addDoc(collection(db, 'members'), {
                  firstName: row['First Name'] || '',
                  lastName: row['Last Name'] || '',
                  email: row['Email'] || '',
                  phone: row['Phone'] || '',
                  address: row['Address'] || '',
                  createdAt: new Date(),
                  createdBy: auth.currentUser.uid
                });
                successCount++;
              } catch (error) {
                errors.push(`Error adding member: ${row['First Name']} ${row['Last Name']}`);
              }
            }
          } else if (type === 'submissions') {
            for (const row of jsonData) {
              try {
                await addDoc(collection(db, 'submissions'), {
                  memberId: row['Member ID'] || '',
                  memberName: row['Member Name'] || '',
                  tithe: parseFloat(row['Tithe']) || 0,
                  offering: parseFloat(row['Offering']) || 0,
                  weekNumber: parseInt(row['Week Number']) || 1,
                  date: new Date(row['Date'] || new Date()),
                  createdAt: new Date(),
                  createdBy: auth.currentUser.uid
                });
                successCount++;
              } catch (error) {
                errors.push(`Error adding submission for: ${row['Member Name']}`);
              }
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} ${type}`);
          }
          if (errors.length > 0) {
            console.error('Import errors:', errors);
            toast.error(`Failed to import ${errors.length} items`);
          }
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Error processing file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const renderSettingsMenu = () => (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-dark-fg-alt dark:hover:text-dark-fg-primary focus:outline-none">
        <Cog6ToothIcon className="h-6 w-6" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-[-8rem] bottom-12 w-56 rounded-md bg-white dark:bg-dark-bg-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/settings"
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-dark-fg-secondary`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5" />
                  Clear Base
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => membersFileInputRef.current?.click()}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-dark-fg-secondary`}
                >
                  <ArrowUpTrayIcon className="mr-3 h-5 w-5" />
                  Import Members
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => submissionsFileInputRef.current?.click()}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-dark-fg-secondary`}
                >
                  <ArrowUpTrayIcon className="mr-3 h-5 w-5" />
                  Import Submissions
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={membersFileInputRef}
        className="hidden"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFileUpload(e, 'members')}
      />
      <input
        type="file"
        ref={submissionsFileInputRef}
        className="hidden"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFileUpload(e, 'submissions')}
      />
    </Menu>
  );

  const renderUserInfo = () => (
    <Menu as="div" className="relative ml-3">
      <Menu.Button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <span className="sr-only">Open user menu</span>
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/50 dark:bg-dark-bg-secondary backdrop-blur-sm">
          <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-dark-fg-alt" />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-dark-fg-primary">
              {userInfo?.name || userInfo?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-fg-alt">
              {userInfo?.role === 'admin' ? 'Administrator' : 'Regular User'}
            </p>
          </div>
        </div>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-dark-bg-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } block px-4 py-2 text-sm text-gray-700 dark:text-dark-fg-secondary`}
                >
                  Your Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? 'bg-gray-100 dark:bg-dark-bg-alt' : ''
                  } block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                >
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-dark-bg-secondary pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex flex-shrink-0 items-center px-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-dark-fg-primary">Church Finance</h1>
                </div>
                <nav className="mt-5 flex-1 space-y-1 px-2">
                  {navigation.map((item) => (
                    (!item.adminOnly || userInfo?.role === 'admin') && (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`sidebar-link ${location.pathname === item.href ? 'sidebar-link-active' : ''}`}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    )
                  ))}
                </nav>
                <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-dark-border p-4">
                  <div className="flex items-center justify-between w-full">
                    {userInfo?.role === 'admin' && renderSettingsMenu()}
                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-dark-fg-alt dark:hover:text-dark-fg-primary"
                    >
                      {darkMode ? (
                        <SunIcon className="h-6 w-6" />
                      ) : (
                        <MoonIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-sidebar lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-dark-bg-secondary">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-fg-primary">Church Finance</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                (!item.adminOnly || userInfo?.role === 'admin') && (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-link ${location.pathname === item.href ? 'sidebar-link-active' : ''}`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center justify-between w-full">
              {userInfo?.role === 'admin' && renderSettingsMenu()}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-dark-fg-alt dark:hover:text-dark-fg-primary"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-sm shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          {/* Header content */}
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              {/* Page title can go here */}
            </div>
            <div className="ml-4 flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-dark-fg-alt dark:hover:text-dark-fg-primary focus:outline-none"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>

              {/* User menu */}
              {renderUserInfo()}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Auto logout warning */}
      <AutoLogoutWarning
        isOpen={showWarning}
        onStaySignedIn={resetTimer}
        onSignOut={handleLogout}
      />
    </div>
  );
}

export default DashboardLayout; 