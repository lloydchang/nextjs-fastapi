// File: app/api/chat/utils/contextManager.ts

/**
 * Manages the context history to accumulate responses across interactions.
 * @param previousContext - The previous context accumulated so far
 * @param latestResponse - The latest response from the AI to add to the context
 * @returns { string } - The updated context including the latest response
 */
export function updateContextHistory(previousContext: string, latestResponse: string): string {
    const updatedContext = previousContext + '\n' + latestResponse;
    const maxContextLength = 10000; // Example limit (characters)
    
    if (updatedContext.length > maxContextLength) {
      return updatedContext.slice(-maxContextLength);  // Keep only the most recent parts of the context
    }
  
    return updatedContext;
  }
  