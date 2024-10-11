// File: components/utils/talkPanelUtils.ts

import fetch from 'node-fetch';

/**
 * Determines an initial search keyword randomly from predefined options.
 */
export const determineInitialKeyword = (): string => {
  const keywords = [
    'poverty', 'hunger', 'health', 'education', 'gender',
    'water', 'energy', 'work', 'industry', 'inequality',
    'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'
  ];
  const randomIndex = Math.floor(Math.random() * keywords.length);
  return keywords[randomIndex];
};

/**
 * Fisher-Yates shuffle algorithm to randomize the order of results.
 * @param array - The array to shuffle.
 * @returns A new shuffled array.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Fetches and scrapes the processed transcript from a given URL.
 * @param transcriptUrl - The URL of the transcript to fetch.
 * @returns The transcript as a string.
 */
export const scrapeTranscript = async (transcriptUrl: string): Promise<string> => {
  try {
    const response = await fetch(`/api/proxyTranscript?transcriptUrl=${encodeURIComponent(transcriptUrl)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transcript || 'Failed to retrieve transcript.';
  } catch (error) {
    console.error(`Error scraping transcript from URL ${transcriptUrl}:`, error);
    return 'Failed to retrieve transcript.';
  }
};
