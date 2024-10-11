// File: app/api/chat/utils/truncate.ts

/**
 * Utility function to randomly select a section from the text with 1 or 2 sentences
 */
export function randomlyTruncateSentences(text: string): string {
    // Regular expression to capture sentences and special phrases like "(Applause)" or "(Laughter)"
    const sentencePattern = /[^.!?]*[.!?]+|[(][^)]*[)]/g;
    const sentences = text.match(sentencePattern) || [];
  
    if (sentences.length === 0) return text; // If no sentences are found, return the original text
  
    // Choose a random starting index for truncation
    const startIndex = Math.floor(Math.random() * sentences.length);
  
    // Choose 1 or 2 sentences to include after the starting index
    const numSentencesToInclude = Math.floor(Math.random() * 2) + 1; // Randomly choose between 1 and 2
  
    // Extract the selected range of sentences
    const truncatedSentences = sentences.slice(startIndex, startIndex + numSentencesToInclude);
  
    return truncatedSentences.join(' ').trim();
  }
  