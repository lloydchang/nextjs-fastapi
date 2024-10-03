// File: utils/stringUtils.ts

/**
 * Checks if a given string is a default placeholder.
 * 
 * @param value - The string to check.
 * @returns True if the string is a placeholder, false otherwise.
 */
export function isDefaultPlaceholder(value: string): boolean {
    const lowerValue = value.toLowerCase();
    return (
      lowerValue.includes('your') ||
      lowerValue.includes('placeholder') ||
      lowerValue.trim() === ''
    );
  }
  