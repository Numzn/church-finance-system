import React, { useEffect, useState } from 'react';

const LoadingScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide loading screen after 3 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-dark-bg-primary flex items-center justify-center z-50 transition-opacity duration-500">
      {/* Circling cut circle */}
      <div className="absolute w-[120px] h-[120px] border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
      
      {/* Animated letters */}
      <div className="flex space-x-1 relative">
        <span className="text-white dark:text-dark-fg-primary text-3xl font-bold animate-letter">N</span>
        <span className="text-white dark:text-dark-fg-primary text-3xl font-bold animate-letter2">U</span>
        <span className="text-white dark:text-dark-fg-primary text-3xl font-bold animate-letter3">M</span>
        <span className="text-white dark:text-dark-fg-primary text-3xl font-bold animate-letter4">Z</span>
      </div>
    </div>
  );
};

export default LoadingScreen; 