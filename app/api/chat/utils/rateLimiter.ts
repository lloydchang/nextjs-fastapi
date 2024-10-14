// File: app/api/chat/utils/rateLimiter.ts

const RATE_LIMIT = 1; // Max number of requests per client during the rate limit window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Map to track rate limits per client
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

// Function to check if a client is rate-limited
export function checkRateLimit(clientId: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientId);

  if (rateInfo) {
    if (now - rateInfo.firstRequestTime < RATE_LIMIT_WINDOW) {
      if (rateInfo.count >= RATE_LIMIT) {
        return {
          limited: true,
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - rateInfo.firstRequestTime)) / 1000),
        };
      } else {
        rateInfo.count += 1;
        rateLimitMap.set(clientId, rateInfo);
        return { limited: false };
      }
    } else {
      rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
      return { limited: false };
    }
  } else {
    rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
    return { limited: false };
  }
}
