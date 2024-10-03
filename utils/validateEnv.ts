// utils/validateEnv.ts

const requiredVars = [
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_GEMINI_MODEL',
    'GOOGLE_VERTEX_AI_LOCATION',
    'GOOGLE_CLOUD_PROJECT',
    'FALLBACK_MODEL',
    'LOCAL_LLAMA_ENDPOINT',
    'DEFAULT_MODEL',
  ];
  
  export function validateEnv() {
    // Collect all missing environment variables
    const missingVars = requiredVars.filter((key) => !process.env[key]);
  
    // Throw an error if any required variables are missing
    if (missingVars.length > 0) {
      console.error(`Missing environment variables: ${missingVars.join(', ')}`);
      return; // Skip throwing an error for a more graceful startup
    }
  
    console.log('Environment variables validated successfully.');
  }
  