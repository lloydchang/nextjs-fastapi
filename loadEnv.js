// loadEnv.js
const dotenv = require('dotenv');

// Manually load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Log loaded environment variables to verify
console.log('Environment variables loaded manually:', process.env);
