// File: utils/validateEnv.ts

/**
 * Validates that all required environment variables are set.
 * Throws an error if any required variable is missing.
 */
export function validateEnv() {
    const requiredEnvVars = [
      'DEFAULT_MODEL',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'GOOGLE_GEMINI_MODEL',
      'GOOGLE_VERTEX_AI_LOCATION',
      'GOOGLE_CLOUD_PROJECT',
      'FALLBACK_MODEL',
      'LOCAL_LLAMA_ENDPOINT',
    ];
  
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  
    // Additional validation can be added here if necessary
  }
  