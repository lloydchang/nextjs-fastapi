// utils/chatUtils.ts

let lastFinalResult: string = '';
let lastInterimResult: string = '';

// Function to update the final result using strict and fuzzy trimming logic
export const updateFinalResult = (newResult: string) => {
  const normalizedNewResult = normalizeText(newResult);
  const normalizedLastFinalResult = normalizeText(lastFinalResult);
  const normalizedLastInterimResult = normalizeText(lastInterimResult);

  // Check if the new final result is the same as the last final result
  if (normalizedNewResult === normalizedLastFinalResult) {
    return false;
  }

  // Step 1: Try strict prefix-based trimming first
  let trimmedFinalResult = strictPrefixTrim(normalizedNewResult, normalizedLastInterimResult);

  // Step 2: If no strict trimming was done, apply fuzzy matching for partial overlap trimming
  if (trimmedFinalResult === normalizedNewResult) {
    trimmedFinalResult = trimFuzzyOverlap(normalizedNewResult, normalizedLastInterimResult);
  }

  if (trimmedFinalResult.length === 0 || trimmedFinalResult === normalizedLastFinalResult) {
    return false;
  }

  lastFinalResult = normalizedNewResult; // Update the last final result
  return true; // Unique final result
};

// Function to update the interim result if it's not a repeated fragment
export const updateInterimResult = (newResult: string) => {
  const normalizedNewResult = normalizeText(newResult);
  const normalizedLastInterimResult = normalizeText(lastInterimResult);

  if (normalizedNewResult.length < 10) return false;

  if (normalizedNewResult === normalizedLastInterimResult || isFragmentRepeated(normalizedNewResult, normalizedLastInterimResult)) {
    return false;
  }

  lastInterimResult = normalizedNewResult;
  return true; // Processed unique interim result
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const strictPrefixTrim = (final: string, interim: string): string => (final.startsWith(interim) ? final.substring(interim.length).trim() : final);

const trimFuzzyOverlap = (final: string, interim: string): string => {
  if (!interim) return final;
  const similarityRatio = getSimilarityRatio(final, interim);
  if (similarityRatio >= 0.8) return final.substring(getCommonPrefixLength(final, interim)).trim();
  return final;
};

const getSimilarityRatio = (s1: string, s2: string): number => 1 - levenshteinDistance(s1, s2) / Math.max(s1.length, s2.length);

const levenshteinDistance = (a: string, b: string): number => {
  const an = a.length, bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  for (let i = 1; i <= an; i++) for (let j = 1; j <= bn; j++) matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return matrix[an][bn];
};

const isFragmentRepeated = (current: string, previous: string) => getCommonPrefixLength(current, previous) / Math.min(current.length, previous.length) >= 0.8;

const getCommonPrefixLength = (s1: string, s2: string): number => {
  let n = 0;
  while (n < s1.length && n < s2.length && s1[n] === s2[n]) n++;
  return n;
};
