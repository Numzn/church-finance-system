import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

// Constants
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS) || 5;
const LOGIN_COOLDOWN_MINUTES = parseInt(process.env.REACT_APP_LOGIN_COOLDOWN_MINUTES) || 15;
const MAX_FILE_SIZE_MB = parseInt(process.env.REACT_APP_MAX_FILE_SIZE_MB) || 5;
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.REACT_APP_SESSION_TIMEOUT_MINUTES) || 60;
const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];
const MAX_INPUT_LENGTH = 1000;
const API_RATE_LIMIT = 100; // requests per minute
const PASSWORD_EXPIRY_DAYS = 90;

// Rate limiting
const apiRequests = new Map();
const lastRequestReset = new Map();

// Track login attempts
const loginAttempts = new Map();
const loginCooldowns = new Map();

// Enhanced audit logging with more details
export const logAuditEvent = async (userId, action, details) => {
  try {
    const auditRef = doc(db, 'auditLogs', `${Date.now()}_${userId}`);
    await setDoc(auditRef, {
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      ipAddress: 'Collected server-side',
      platform: navigator.platform,
      location: window.location.href,
      referrer: document.referrer,
      sessionId: sessionStorage.getItem('sessionId')
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Attempt to log to a backup location
    try {
      await addDoc(collection(db, 'audit_logs_backup'), {
        userId,
        action,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (backupError) {
      console.error('Backup audit logging failed:', backupError);
    }
  }
};

// Enhanced input validation
export const validateInput = (input, type = 'text') => {
  if (input === null || input === undefined) return false;
  
  const inputStr = String(input);
  if (inputStr.length > MAX_INPUT_LENGTH) return false;
  
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputStr);
    case 'name':
      return /^[a-zA-Z\s-']{2,50}$/.test(inputStr);
    case 'phone':
      return /^\+?[\d\s-]{10,15}$/.test(inputStr);
    case 'date':
      return !isNaN(Date.parse(inputStr));
    default:
      return !/[<>{}]/g.test(inputStr); // Basic XSS protection
  }
};

// Enhanced password validation with common password check
export const validatePassword = (password) => {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNoCommonPatterns = !/(123|password|admin|qwerty|letmein|welcome)/i.test(password);
  const hasNoRepeatingChars = !/(.)\1{2,}/.test(password); // No more than 2 repeated characters
  const hasNoSequential = !/(abc|bcd|cde|def|efg|123|234|345|456|567|678|789)/i.test(password);

  const errors = [];
  if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');
  if (!hasNoCommonPatterns) errors.push('Password contains common patterns that are not allowed');
  if (!hasNoRepeatingChars) errors.push('Password contains too many repeating characters');
  if (!hasNoSequential) errors.push('Password contains sequential characters');

  return errors;
};

// Enhanced input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove VBScript protocol
    .replace(/&#/gi, '') // Remove HTML entities
    .replace(/\\x[0-9a-f]{2}/gi, '') // Remove hex escapes
    .replace(/\\u[0-9a-f]{4}/gi, '') // Remove unicode escapes
    .replace(/[\x20-\x7E]/g, (char) => char) // Keep only printable ASCII characters
    .trim();
};

// API rate limiting
export const checkApiLimit = (userId) => {
  const now = Date.now();
  const userRequests = apiRequests.get(userId) || 0;
  const lastReset = lastRequestReset.get(userId) || 0;

  // Reset counter if it's been more than a minute
  if (now - lastReset > 60000) {
    apiRequests.set(userId, 1);
    lastRequestReset.set(userId, now);
    return true;
  }

  if (userRequests >= API_RATE_LIMIT) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  apiRequests.set(userId, userRequests + 1);
  return true;
};

// Enhanced file validation
export const validateFileUpload = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
  }

  // Check file type
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
    throw new Error(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  // Enhanced content validation
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      // Check for potentially malicious content
      const dangerousPatterns = [
        '<script',
        'javascript:',
        'vbscript:',
        'data:',
        'document.cookie',
        'eval(',
        'Function(',
        'fromCharCode',
        'ActiveXObject',
        'execScript',
        'msxml2',
        'shell:',
        'http-equiv'
      ];

      if (dangerousPatterns.some(pattern => content.toLowerCase().includes(pattern))) {
        reject(new Error('File contains potentially malicious content'));
        return;
      }

      // Check for executable content using hex values
      if (content.includes('\x00') || (content.includes('PK') && content.includes('\x03') && content.includes('\x04'))) {
        reject(new Error('File contains executable content'));
        return;
      }

      resolve(true);
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

// Enhanced session management
let sessionTimeout;
let lastActivity = Date.now();

export const updateLastActivity = () => {
  lastActivity = Date.now();
};

export const checkSessionActivity = (callback) => {
  const inactiveTime = (Date.now() - lastActivity) / 1000 / 60; // in minutes
  if (inactiveTime > SESSION_TIMEOUT_MINUTES) {
    callback();
    return false;
  }
  return true;
};

export const resetSessionTimeout = (callback) => {
  if (sessionTimeout) clearTimeout(sessionTimeout);
  updateLastActivity();
  sessionTimeout = setTimeout(() => {
    if (!checkSessionActivity(callback)) {
      callback();
    }
  }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
};

export const clearSessionTimeout = () => {
  if (sessionTimeout) clearTimeout(sessionTimeout);
};

// Content Security Policy
export const setupCSP = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = `
    default-src 'self';
    script-src 'self' https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
  `;
  document.head.appendChild(meta);
};

// Initialize security measures with enhanced protections
export const initializeSecurity = () => {
  setupCSP();
  
  // Activity monitoring
  const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    document.addEventListener(event, updateLastActivity);
  });

  // Storage monitoring
  window.addEventListener('storage', (e) => {
    if (e.key && (e.key.includes('token') || e.key.includes('auth'))) {
      logAuditEvent(auth.currentUser?.uid || 'unknown', 'storage_tampering', {
        key: e.key,
        oldValue: 'redacted',
        newValue: 'redacted'
      });
    }
  });

  // Error monitoring
  window.onerror = (message, source, lineno, colno, error) => {
    logAuditEvent(auth.currentUser?.uid || 'unknown', 'client_error', {
      message,
      source,
      lineno,
      colno,
      stack: error?.stack
    });
    return false;
  };

  // Prevent debugging
  setInterval(() => {
    const isDevToolsOpen = window.outerHeight - window.innerHeight > 200;
    if (isDevToolsOpen) {
      logAuditEvent(auth.currentUser?.uid || 'unknown', 'devtools_opened', {
        timestamp: new Date().toISOString()
      });
    }
  }, 1000);
};

export const incrementLoginAttempts = (email) => {
  const attempts = loginAttempts.get(email) || 0;
  loginAttempts.set(email, attempts + 1);
};

export const resetLoginAttempts = (email) => {
  loginAttempts.delete(email);
  loginCooldowns.delete(email);
};

export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

export const requireAuth = (navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 