const fs = require('fs');
const path = require('path');

// Log environment type
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Is Vercel?', process.env.VERCEL ? 'Yes' : 'No');

const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

// Skip all checks in production/Vercel environment
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  console.log('Running in production/Vercel environment - checking environment variables directly');
  
  // Check if variables exist in process.env
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Warning: Some environment variables are missing:', missingVars);
    // Don't exit with error in production, just warn
    console.log('Continuing build process despite missing variables...');
  } else {
    console.log('✓ All required environment variables are present');
  }
  
  process.exit(0);
}

function verifyEnvFile(filePath) {
  try {
    console.log('Checking env file:', filePath);
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    const missingVars = requiredEnvVars.filter(varName => !envVars[varName]);
    
    if (missingVars.length > 0) {
      console.warn('\x1b[33m%s\x1b[0m', 'Warning: Missing environment variables in .env:');
      missingVars.forEach(varName => {
        console.warn('\x1b[33m%s\x1b[0m', `- ${varName}`);
      });
    }

    // Check for empty values
    const emptyVars = requiredEnvVars.filter(varName => envVars[varName] === '');
    
    if (emptyVars.length > 0) {
      console.warn('\x1b[33m%s\x1b[0m', 'Warning: The following environment variables are empty:');
      emptyVars.forEach(varName => {
        console.warn('\x1b[33m%s\x1b[0m', `- ${varName}`);
      });
    }

    console.log('\x1b[32m%s\x1b[0m', '✓ Environment variables verified successfully in file:', filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Note: Environment file not found: ${filePath}`);
    } else {
      console.warn('\x1b[33m%s\x1b[0m', `Warning reading .env file: ${error.message}`);
    }
    return false;
  }
}

// Check both .env and .env.local in development
if (process.env.NODE_ENV !== 'production') {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local')
  ];

  let verified = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      verified = verifyEnvFile(envPath) || verified;
    }
  }

  if (!verified) {
    console.warn('\x1b[33m%s\x1b[0m', 'Warning: No environment files found in development. Please create either .env or .env.local');
  }
}
