// File: components/utils/talkPanelUtils.ts

/**
 * Determines an initial search keyword randomly from predefined options.
 */
export const determineInitialKeyword = (): string => {
  const keywords = [
    'SDG 1: No Poverty', 
    'SDG 2: Zero Hunger', 
    'SDG 3: Good Health and Well-Being', 
    'SDG 4: Quality Education', 
    'SDG 5: Gender Equality',
    'SDG 6: Clean Water and Sanitation', 
    'SDG 7: Affordable and Clean Energy', 
    'SDG 8: Decent Work and Economic Growth', 
    'SDG 9: Industry, Innovation, and Infrastructure', 
    'SDG 10: Reduced Inequalities',
    'SDG 11: Sustainable Cities and Communities', 
    'SDG 12: Responsible Consumption and Production', 
    'SDG 13: Climate Action', 
    'SDG 14: Oceans', 
    'SDG 15: Life on Land', 
    'SDG 16: Peace, Justice, and Strong Institutions', 
    'SDG 17: Partnerships for the Goals'
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
    // Use native fetch in client-side code
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
