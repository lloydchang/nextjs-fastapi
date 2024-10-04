// File: app/api/chat/utils/envUtils.ts

/**
 * Shared list of required environment variables for the application.
 */
export const requiredEnvVars = [
  'DEFAULT_MODEL',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_GEMINI_MODEL',
  'GOOGLE_VERTEX_AI_LOCATION',
  'GOOGLE_CLOUD_PROJECT',
];

/**
 * Validates and logs the environment variables.
 * @param envVars - A list of required environment variable names.
 * @param logMessages - Array to store log messages.
 * @returns A boolean indicating if all required environment variables are properly configured.
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
