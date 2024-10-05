// utils/speechRecognitionUtils.ts

// Helper function to calculate the Levenshtein distance between two strings
export const levenshteinDistance = (a: string, b: string) => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
  
    const matrix = Array(an + 1)
      .fill(0)
      .map(() => Array(bn + 1).fill(0));
  
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  
    for (let i = 1; i <= an; i++) {
      for (let j = 1; j <= bn; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  
    return matrix[an][bn];
  };
  
  // Determine if the new result is substantially different from the previous one
  export const isSubstantiallyDifferent = (current: string, previous: string) => {
    const distance = levenshteinDistance(current, previous);
    const maxLength = Math.max(current.length, previous.length);
    return distance / maxLength > 0.2; // Only consider updates if >20% different
  };
  
  // Helper function to determine if a sentence or clause is complete
  export const isSentenceComplete = (text: string) => {
    const sentenceEndRegex = /[.!?]$/; // Check for sentence-ending punctuation
    const clauseSeparatorRegex = /(?:,| and | but | so | because | then | therefore | however )$/gi;
    return sentenceEndRegex.test(text) || clauseSeparatorRegex.test(text); // Returns true if complete
  };
  