import React from 'react';
import { useEffect, useState } from 'react';

function AutoLogoutWarning({ isOpen, onStayLoggedIn, onLogout }) {
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds warning

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(60);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Session Timeout Warning
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Your session will expire in {timeLeft} seconds due to inactivity. Would you like to stay logged in?
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
              onClick={onStayLoggedIn}
            >
              Stay Logged In
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoLogoutWarning; 