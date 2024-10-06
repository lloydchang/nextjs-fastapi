// File: app/api/chat/utils/validate.ts

import logger from './logger';

/**
 * Validates that all required environment variables are set and not placeholders.
 * @param vars - Array of environment variable names to validate.
 * @returns {boolean} - Returns true if all variables are valid, false otherwise.
 */
export function validateEnvVars(vars: string[]): boolean {
  const areValid = vars.every(varName => {
    const value = process.env[varName];
    return value && !value.includes('your-');
  });

  if (!areValid) {
    logger.silly(`app/api/chat/utils/validate.ts - Validation failed for environment variables: ${vars.join(', ')}`);
  } else {
    logger.debug(`app/api/chat/utils/validate.ts - Validated environment variables: ${vars.join(', ')}`);
  }

  return areValid;
}
