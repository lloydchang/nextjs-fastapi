// File: app/api/chat/utils/validate.ts

/**
 * Validates required environment variables.
 * Logs an error if any variable is undefined or contains an invalid placeholder value.
 * @param envVars - Array of environment variable names to validate.
 * @returns A boolean indicating whether the validation was successful.
 */
export function validateEnvVars(envVars: string[]): boolean {
  let isValid = true;
  const invalidVars: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar];
    if (!value || value.includes('your-')) {
      isValid = false;
      invalidVars.push(envVar);
    }
  }

  // if (invalidVars.length > 0) {
  //   console.error(`The following environment variables are missing or contain invalid placeholders: ${invalidVars.join(', ')}`);
  // }

  return isValid;
}
