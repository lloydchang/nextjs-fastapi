// File: app/api/chat/utils/detectMissingContent.ts

import { extractSentencesFromPrompt } from 'app/api/chat/utils/sentenceExtractor';

/**
 * Function to detect which sentences from the system prompt are missing
 * @param systemPrompt - The full system prompt text
 * @param latestResponse - The latest AI response
 * @returns { { missingSentences: string[] } } - An object with missing sentences
 */
export function detectMissingContent(systemPrompt: string, latestResponse: string): { missingSentences: string[] } {
  const missingSentences: string[] = [];

  // Extract sentences from the system prompt
  const sentences = extractSentencesFromPrompt(systemPrompt);

  // Check if each sentence is covered in the response
  sentences.forEach(sentence => {
    const sentenceFound = latestResponse.toLowerCase().includes(sentence.toLowerCase());
    
    if (!sentenceFound) {
      missingSentences.push(sentence);
    }
  });

  return { missingSentences };
}
