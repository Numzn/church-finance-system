// Format currency in Zambian Kwacha
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Get current week number (1-5) based on the current date
export const getCurrentWeekNumber = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstSunday = new Date(firstDayOfMonth);
  
  // Find the first Sunday of the month
  while (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + 1);
  }

  // Calculate which week of the month the current date falls in
  const dayDifference = Math.floor((today - firstSunday) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(dayDifference / 7) + 1;

  return Math.min(weekNumber, 5); // Cap at 5 weeks
};

// Format date to local string
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-ZM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Get week dates range
export const getWeekDates = (weekNumber, month = new Date().getMonth(), year = new Date().getFullYear()) => {
  const firstDayOfMonth = new Date(year, month, 1);
  let firstSunday = new Date(firstDayOfMonth);
  
  // Find the first Sunday of the month
  while (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + 1);
  }

  // Calculate start and end dates for the specified week
  const startDate = new Date(firstSunday);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    start: startDate,
    end: endDate,
  };
};

// Check if user has admin role
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

// Generate receipt number
export const generateReceiptNumber = (date = new Date()) => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP-${year}${month}-${random}`;
}; 