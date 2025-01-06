// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

// Password strength validation
export const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  input = input.replace(/<[^>]*>/g, '');
  
  // Convert special characters to HTML entities
  input = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return input.trim();
};

// Number validation
export const isValidNumber = (value) => {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(Number(value));
  return false;
};

// Date validation
export const isValidDate = (date) => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

// Phone number validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Currency validation
export const isValidCurrency = (amount) => {
  if (typeof amount === 'number') return amount >= 0;
  if (typeof amount === 'string') {
    const num = Number(amount.replace(/[^0-9.-]+/g, ''));
    return !isNaN(num) && num >= 0;
  }
  return false;
};

// Object ID validation (for Firebase IDs)
export const isValidId = (id) => {
  return typeof id === 'string' && id.length > 0;
};

// Role validation
export const isValidRole = (role) => {
  const validRoles = ['admin', 'user'];
  return validRoles.includes(role);
};

// File type validation
export const isValidFileType = (file, allowedTypes) => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

// File size validation (in bytes)
export const isValidFileSize = (file, maxSize) => {
  if (!file || !file.size) return false;
  return file.size <= maxSize;
};

// Generic required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}; 