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

function verifyEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    // Parse env file content
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    // Check for missing variables
    const missingVars = requiredEnvVars.filter(varName => !envVars[varName]);
    
    if (missingVars.length > 0) {
      console.error('\x1b[31m%s\x1b[0m', 'Error: Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error('\x1b[31m%s\x1b[0m', `- ${varName}`);
      });
      process.exit(1);
    }

    // Check for empty values
    const emptyVars = requiredEnvVars.filter(varName => envVars[varName] === '');
    
    if (emptyVars.length > 0) {
      console.error('\x1b[31m%s\x1b[0m', 'Error: The following environment variables are empty:');
      emptyVars.forEach(varName => {
        console.error('\x1b[31m%s\x1b[0m', `- ${varName}`);
      });
      process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', '✓ Environment variables verified successfully');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('\x1b[31m%s\x1b[0m', `Error: Environment file not found: ${filePath}`);
    } else {
      console.error('\x1b[31m%s\x1b[0m', `Error reading environment file: ${error.message}`);
    }
    process.exit(1);
  }
}

// Check both .env and .env.local
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
  console.error('\x1b[31m%s\x1b[0m', 'Error: No environment files found. Please create either .env or .env.local');
  process.exit(1);
} 