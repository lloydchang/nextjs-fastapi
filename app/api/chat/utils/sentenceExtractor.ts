// File: app/api/chat/utils/sentenceExtractor.ts

/**
 * Extracts sentences from the provided text.
 * @param text - The text to extract sentences from.
 * @returns {string[]} - An array of sentences.
 */
export function extractSentencesFromPrompt(text: string): string[] {
    // Split the text into sentences based on common delimiters
    return text.split(/(?<=[.!?])\s+/);
  }
  