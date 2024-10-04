// File: app/api/chat/utils/validateEnv.ts

/**
 * List of required environment variables for the application.
 * These variables must be set for the application to run correctly.
 */
const requiredVars = [
];

/**
 * List of optional environment variables for the application.
 * If these variables are missing, the application will log a warning but continue to run.
 */
const optionalVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_GEMINI_MODEL',
  'GOOGLE_VERTEX_AI_LOCATION',
  'GOOGLE_CLOUD_PROJECT',
  'DEFAULT_MODEL',
  'FALLBACK_MODEL',
  'LOCAL_LLAMA_ENDPOINT',
];

/**
 * Validates that all required and optional environment variables are set.
 * Logs errors for missing required variables and warnings for missing optional variables.
 */
export function validateEnv() {
  const missingRequiredVars = requiredVars.filter((key) => !process.env[key]);
  const missingOptionalVars = optionalVars.filter((key) => !process.env[key]);

  if (missingRequiredVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingRequiredVars.join(', ')}`);
    throw new Error(`Environment validation failed. Missing required variables: ${missingRequiredVars.join(', ')}`);
  }

  if (missingOptionalVars.length > 0) {
    console.warn(`⚠️ Warning: Missing optional environment variables: ${missingOptionalVars.join(', ')}`);
    console.warn(`The application will continue running, but some features may not be available.`);
  }

  console.log('✅ Environment variables validated successfully.');
}
