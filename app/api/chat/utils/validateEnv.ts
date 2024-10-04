// File: app/api/chat/utils/validateEnv.ts

const requiredVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_GEMINI_MODEL',
  'GOOGLE_VERTEX_AI_LOCATION',
  'GOOGLE_CLOUD_PROJECT',
  'FALLBACK_MODEL',
  'LOCAL_LLAMA_ENDPOINT',
  'DEFAULT_MODEL',
];

/**
 * Validates that all required environment variables are set.
 * Logs errors for missing variables and prevents the application from running if any are missing.
 */
export function validateEnv() {
  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    console.error(`Missing environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Environment validation failed. Missing variables: ${missingVars.join(', ')}`);
  }

  console.log('Environment variables validated successfully.');
}
