// File: app/api/chat/utils/validate.ts

/**
 * Validates that all required environment variables are set and not placeholders.
 * @param vars - Array of environment variable names to validate.
 * @returns {boolean} - Returns true if all variables are valid, false otherwise.
 */
export function validateEnvVars(vars: string[]): boolean {
  return vars.every(varName => {
    const value = process.env[varName];
    return value && !value.includes('your-');
  });
}
