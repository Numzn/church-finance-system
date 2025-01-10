const fs = require('fs');
const path = require('path');

const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

function verifyEnvFile() {
  // Check if running in Vercel
  if (process.env.VERCEL) {
    console.log('Running on Vercel - skipping .env file check');
    
    // Verify environment variables are set in Vercel
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('\x1b[33m%s\x1b[0m', 'Warning: Missing environment variables in Vercel:');
      missingVars.forEach(varName => {
        console.warn('\x1b[33m%s\x1b[0m', `- ${varName}`);
      });
    }
    
    return true;
  }

  try {
    // Local development - check .env file
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
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

    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('\x1b[33m%s\x1b[0m', 'Warning: .env file not found');
    } else {
      console.warn('\x1b[33m%s\x1b[0m', `Warning reading .env file: ${error.message}`);
    }
    return true;
  }
}

// Run verification but don't exit on failure
verifyEnvFile(); 