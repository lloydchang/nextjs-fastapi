// File: app/api/chat/utils/validate.ts

/**
 * List of required environment variables for the application.
 * These variables must be set for the application to run correctly.
 */
const requiredVars: string[] = [];

/**
 * List of optional environment variables for the application.
 * If these variables are missing, the application will log a warning but continue to run.
 */
const optionalVars: string[] = [
  'AMAZON_BEDROCK_TITAN_MODEL',
  'GOOGLE_VERTEX_MODEL',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_VERTEX_LOCATION',
  'GOOGLE_CLOUD_PROJECT',
  'OLLAMA_GEMMA_MODEL',
  'OLLAMA_LLAMA_MODEL',
  'OLLAMA_LLAMA_ENDPOINT',
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

/**
 * Validates and logs the environment variables from a provided list.
 * @param envVars - A list of environment variable names to validate.
 * @returns A boolean indicating if all the specified environment variables are properly configured.
 */
export function validateAndLogEnvVars(envVars: string[]): boolean {
  const invalidVars = envVars.filter(
    (varName) => !process.env[varName] || process.env[varName]!.includes('your')
  );

  if (invalidVars.length > 0) {
    invalidVars.forEach((varName) => console.error(`Invalid or missing environment variable: ${varName}`));
    return false;
  }

  return true;
}

export { requiredVars, optionalVars };
