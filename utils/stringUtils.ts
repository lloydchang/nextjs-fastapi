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
  
  /**
   * Sanitizes input by removing any unwanted HTML tags.
   * 
   * @param input - The input string to be sanitized.
   * @returns A sanitized string with HTML tags removed.
   */
  export function sanitizeInput(input: string): string {
    return input.replace(/<[^>]*>?/gm, '');
  }
  