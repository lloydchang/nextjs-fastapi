// utils/chatUtils.ts

let lastFinalResult: string = '';
let lastInterimResult: string = '';

// Function to update the final result if it's substantially different
export const updateFinalResult = (newResult: string) => {
  if (newResult.trim() === lastFinalResult.trim()) return false;
  lastFinalResult = newResult.trim();
  return true; // Unique final result
};

// Function to update the interim result if it's substantially different
export const updateInterimResult = (newResult: string) => {
  if (newResult.trim().length < 10) return false; // Ignore very short results
  if (isFragmentRepeated(newResult, lastInterimResult)) return false;
  lastInterimResult = newResult.trim();
  return true; // Unique interim result
};

// Check if final is too similar to the last interim
export const isSimilarToLastInterim = (finalResult: string): boolean => {
  if (finalResult.trim().length < lastInterimResult.trim().length * 0.9) return true; // Final too short
  return isFragmentRepeated(finalResult, lastInterimResult);
};

// Utility function to detect if a fragment is repeated
const isFragmentRepeated = (current: string, previous: string) => {
  const minLength = Math.min(current.length, previous.length);
  const commonPrefix = getCommonPrefixLength(current, previous);
  return minLength >= 5 && commonPrefix / minLength >= 0.8; // Adjust repetition threshold as needed
};

// Helper function to get common prefix length
const getCommonPrefixLength = (s1: string, s2: string): number => {
  let n = 0;
  while (n < s1.length && n < s2.length && s1[n] === s2[n]) n++;
  return n;
};
