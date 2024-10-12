// File: app/api/chat/utils/detectPlaceholders.ts

/**
 * Function to detect placeholders in the generated response. Placeholders are in the format [Placeholder].
 * @param response - The response string from the model.
 * @returns {boolean} - Returns true if placeholders are detected, otherwise false.
 */
export function detectPlaceholders(response: string): boolean {
    // Check if the response contains any placeholders in square brackets
    return /\[[^\]]+\]/.test(response);
  }
  