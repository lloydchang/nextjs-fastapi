// File: app/api/chat/utils/tokenizer.ts

/**
 * Approximates the number of tokens in a given text.
 * Note: For precise token counts, use a tokenizer compatible with Ollama Gemma.
 * @param text - The text to tokenize.
 * @returns {number} - The approximate number of tokens.
 */
export function countTokens(text: string): number {
    return Math.ceil(text.length / 4); // Approximation: 1 token ≈ 4 characters
  }
  