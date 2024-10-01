// utils/chatUtils.ts

let lastFinalResult: string = '';
let lastInterimResult: string = '';

export const updateFinalResult = (newResult: string) => {
  if (newResult.trim() === lastFinalResult.trim()) return false;
  lastFinalResult = newResult.trim();
  return true; // Unique final result
};

export const updateInterimResult = (newResult: string) => {
  if (newResult.trim().length < 10) return false; // Ignore very short results
  if (isFragmentRepeated(newResult, lastInterimResult)) return false;
  lastInterimResult = newResult.trim();
  return true; // Unique interim result
};

// Utility function to trim overlapping words between last interim and new input
export const trimOverlap = (current: string, previous: string) => {
  if (!previous || !current) return current;

  // Split both strings into arrays of words
  const previousWords = previous.trim().split(/\s+/);
  const currentWords = current.trim().split(/\s+/);

  // Find the overlap and trim it from the current message
  let overlapIndex = 0;
  for (let i = 0; i < previousWords.length; i++) {
    if (currentWords[i] === previousWords[i]) {
      overlapIndex++;
    } else {
      break;
    }
  }

  // Remove overlapping words from the beginning of the current message
  const trimmedMessage = currentWords.slice(overlapIndex).join(' ');
  return trimmedMessage.trim();
};

// Helper function to check for repeated fragments
const isFragmentRepeated = (current: string, previous: string) => {
  const minLength = Math.min(current.length, previous.length);
  const commonPrefix = getCommonPrefixLength(current, previous);
  return minLength >= 5 && commonPrefix / minLength >= 0.8;
};

// Helper function to get common prefix length
const getCommonPrefixLength = (s1: string, s2: string): number => {
  let n = 0;
  while (n < s1.length && n < s2.length && s1[n] === s2[n]) n++;
  return n;
};
