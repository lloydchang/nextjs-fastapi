// File: app/api/chat/handlers/handleRateLimit.ts

import { NextRequest, NextResponse } from 'next/server';
import logger from '../utils/log';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { streamErrorMessage } from './handleError';
import { AppConfig } from '../utils/config';

/**
 * Define a rate limiter with memory storage.
 * The points and duration can be adjusted based on the application's requirements.
 */
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per second(s)
});

/**
 * Handles rate limiting logic and IP extraction for incoming requests.
 * 
 * @param request - The incoming Next.js request object.
 * @param config - Application configuration settings.
 * @returns The rate limit response or null if rate limit is not triggered.
 */
export async function handleRateLimit(request: NextRequest, config: AppConfig): Promise<NextResponse | null> {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || request.ip || 'unknown';
  logger.info(`Client IP: ${ip}`);

  if (config.rateLimitEnabled) {
    try {
      await rateLimiter.consume(ip, 1); // Consuming 1 point per request
      logger.info(`Rate limiting: Allowed request from IP ${ip}`);
    } catch {
      logger.warn(`Rate limiting: Blocked request from IP ${ip}`);
      return streamErrorMessage('Too many requests. Please try again later.', [], config);
    }
  } else {
    logger.info('Rate limiting is off.');
  }

  return null;
}
