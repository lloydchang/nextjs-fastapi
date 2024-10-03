// File: utils/rateLimit.ts

import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true'; // Read from environment

// Create a rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: 100, // Allow 100 requests
  duration: 60, // Per 60 seconds (1 minute)
});

/**
 * Check if rate limiting is enabled and enforce it if so.
 * @param ip - The IP address of the requester.
 * @param points - The number of allowed points (requests) in a time window.
 * @returns - Promise that resolves if allowed or rejects with rate limit error.
 */
export async function checkRateLimit(ip: string, points: number = 100): Promise<void> {
  if (!rateLimitEnabled) {
    console.log(`Rate limiting disabled. Skipping rate limit check for IP: ${ip}`);
    return; // Skip rate limiting if disabled
  }

  console.log(`Rate limiting enabled. Checking rate limit for IP: ${ip}`);
  await rateLimiter.consume(ip, points); // Enforce rate limiting if enabled
}
