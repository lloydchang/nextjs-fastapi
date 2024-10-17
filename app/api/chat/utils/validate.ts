// File: app/api/chat/utils/validate.ts

import logger from 'app/api/chat/utils/logger';

/**
 * Validates that all required environment variables are set and not placeholders.
 * @param vars - Array of environment variable names to validate.
 * @returns {boolean} - Returns true if all variables are valid, false otherwise.
 */
export function validateEnvVars(vars: string[]): boolean {
  const areValid = vars.every(varName => {
    const value = process.env[varName];
    // Check for both '-YOUR' and '-your' placeholders
    // The /i flag in the regular expression makes the match case-insensitive.
    return value && !/YOUR-/i.test(value);
  });

  if (!areValid) {
    // logger.silly(`app/api/chat/utils/validate.ts - Validation failed for environment variables: ${vars.join(', ')}`);
  } else {
    // logger.silly(`app/api/chat/utils/validate.ts - Validated environment variables: ${vars.join(', ')}`);
  }

  return areValid;
}
