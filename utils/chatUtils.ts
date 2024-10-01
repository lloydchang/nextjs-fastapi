// utils/chatUtils.ts

let lastFinalResult: string = '';
let lastInterimResult: string = '';

// Function to update the final result using strict and fuzzy trimming logic
export const updateFinalResult = (newResult: string) => {
  const normalizedNewResult = normalizeText(newResult);
  const normalizedLastFinalResult = normalizeText(lastFinalResult);
  const normalizedLastInterimResult = normalizeText(lastInterimResult);

  console.log('Comparing Final:', { normalizedNewResult, normalizedLastFinalResult, normalizedLastInterimResult });

  // Check if the new final result is the same as the last final result
  if (normalizedNewResult === normalizedLastFinalResult) {
    console.log('Skipped duplicate final result:', normalizedNewResult);
    return false;
  }

  // Step 1: Try strict prefix-based trimming first
  let trimmedFinalResult = strictPrefixTrim(normalizedNewResult, normalizedLastInterimResult);

  // Step 2: If no strict trimming was done, apply fuzzy matching for partial overlap trimming
  if (trimmedFinalResult === normalizedNewResult) {
    trimmedFinalResult = trimFuzzyOverlap(normalizedNewResult, normalizedLastInterimResult);
  }

  // If the trimmed final result is empty or identical to the previous final, skip it
  if (trimmedFinalResult.length === 0 || trimmedFinalResult === normalizedLastFinalResult) {
    console.log('Skipped trimmed or similar final result:', trimmedFinalResult);
    return false;
  }

  lastFinalResult = normalizedNewResult; // Update the last final result
  return true; // Unique final result
};

// Function to update the interim result if it's not a repeated fragment
export const updateInterimResult = (newResult: string) => {
  const normalizedNewResult = normalizeText(newResult);
  const normalizedLastInterimResult = normalizeText(lastInterimResult);

  console.log('Comparing Interim:', { normalizedNewResult, normalizedLastInterimResult });

  if (normalizedNewResult.length < 10) return false;

  if (normalizedNewResult === normalizedLastInterimResult || isFragmentRepeated(normalizedNewResult, normalizedLastInterimResult)) {
    console.log('Skipped duplicate interim result:', normalizedNewResult);
    return false;
  }

  lastInterimResult = normalizedNewResult;
  return true; // Processed unique interim result
};

// Function to normalize text by trimming and removing redundant spaces
const normalizeText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim(); // Replace multiple spaces with a single space and trim
};

// Step 1: Function to perform strict prefix-based trimming
const strictPrefixTrim = (final: string, interim: string): string => {
  if (final.startsWith(interim)) {
    console.log(`Strict prefix trimming applied: "${interim}" from "${final}"`);
    return final.substring(interim.length).trim(); // Remove the strict prefix match
  }
  return final; // No trimming if not a strict prefix
};

// Step 2: Function to trim overlapping parts of the interim from the final result using fuzzy matching
const trimFuzzyOverlap = (final: string, interim: string): string => {
  if (!interim) return final; // No interim to trim

  // Calculate the similarity ratio between the start of the final and the interim
  const similarityRatio = getSimilarityRatio(final, interim);

  // If similarity is above the threshold (e.g., > 80%), consider the interim part as overlapping
  if (similarityRatio >= 0.8) {
    const overlapLength = getCommonPrefixLength(final, interim);
    console.log(`Fuzzy overlap trimming applied for "${interim}" in "${final}"`);
    return final.substring(overlapLength).trim(); // Trim the overlapping segment from the final
  }

  return final; // No overlap detected, return final as is
};

// Helper function to calculate the similarity ratio between two strings using Levenshtein distance
const getSimilarityRatio = (s1: string, s2: string): number => {
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength; // Higher ratio indicates higher similarity
};

// Utility function to calculate the Levenshtein distance between two strings
const levenshteinDistance = (a: string, b: string): number => {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from(Array(an + 1), () => Array(bn + 1).fill(0));
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

// Utility function to detect if a fragment is repeated
const isFragmentRepeated = (current: string, previous: string) => {
  const minLength = Math.min(current.length, previous.length);
  const commonPrefix = getCommonPrefixLength(current, previous);
  return minLength >= 5 && commonPrefix / minLength >= 0.8; // Adjust repetition threshold as needed
};

// Helper function to get common prefix length between two strings
const getCommonPrefixLength = (s1: string, s2: string): number => {
  let n = 0;
  while (n < s1.length && n < s2.length && s1[n] === s2[n]) n++;
  return n;
};
