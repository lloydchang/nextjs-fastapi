// utils/chatUtils.ts

let lastFinalResult: string = '';
let lastInterimResult: string = '';

export const updateFinalResult = (newResult: string) => {
  if (isSubstantiallyDifferent(newResult, lastFinalResult)) {
    lastFinalResult = newResult;
    return true; // Indicate that the final result is new
  }
  return false; // Final result is a duplicate
};

export const updateInterimResult = (newResult: string) => {
  if (isSubstantiallyDifferent(newResult, lastInterimResult)) {
    lastInterimResult = newResult;
    return true; // Indicate that the interim result is new
  }
  return false; // Interim result is a duplicate
};

// A utility function to check the substantial difference
const isSubstantiallyDifferent = (current: string, previous: string) => {
  const distance = levenshteinDistance(current, previous);
  const maxLength = Math.max(current.length, previous.length);
  return distance / maxLength > 0.2; // Adjust the threshold as needed
};

// Helper function to calculate the Levenshtein distance between two strings
const levenshteinDistance = (a: string, b: string) => {
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
