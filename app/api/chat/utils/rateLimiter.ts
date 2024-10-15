// File: app/api/chat/utils/rateLimiter.ts

const RATE_LIMIT = 1000; // Max number of requests per client during the rate limit window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Map to track rate limits per client and abort controllers
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
const abortControllerMap = new Map<string, AbortController>();

// Function to check if a client is rate-limited or abort a previous request
export function checkRateLimit(clientId: string): { limited: boolean; retryAfter?: number; controller?: AbortController } {
  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientId);

  // Get or create a new abort controller for this client
  let abortController = abortControllerMap.get(clientId);
  if (abortController) {
    // Abort previous request
    abortController.abort();
  }
  abortController = new AbortController();
  abortControllerMap.set(clientId, abortController);

  if (rateInfo) {
    if (now - rateInfo.firstRequestTime < RATE_LIMIT_WINDOW) {
      if (rateInfo.count >= RATE_LIMIT) {
        return {
          limited: true,
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - rateInfo.firstRequestTime)) / 1000),
          controller: abortController, // Return controller as part of the response
        };
      } else {
        rateInfo.count += 1;
        rateLimitMap.set(clientId, rateInfo);
        return { limited: false, controller: abortController };
      }
    } else {
      // Reset rate limit after window has passed
      rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
      return { limited: false, controller: abortController };
    }
  } else {
    // Initialize rate limit tracking for a new client
    rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
    return { limited: false, controller: abortController };
  }
}

// Optional function to clear aborted controllers to avoid memory leaks
export function clearAbortController(clientId: string) {
  abortControllerMap.delete(clientId);
}
