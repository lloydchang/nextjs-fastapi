// File: app/api/chat/utils/validation.ts

/**
 * Helper function to check if a configuration value is valid.
 * @param value - The configuration value to validate.
 * @returns True if valid, else false.
 */
export function isValidConfig(value: any): boolean {
    return (
      typeof value === 'string' &&
      value.trim() !== '' &&
      value.trim().toLowerCase() !== 'undefined' &&
      value.trim().toLowerCase() !== 'null'
    );
  }
  