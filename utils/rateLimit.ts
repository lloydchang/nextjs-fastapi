// File: utils/rateLimit.ts

import rateLimit from 'next-rate-limit';

/**
 * Initializes and exports the rate limiter.
 * 
 * The limiter allows a certain number of requests per IP address within a specified interval.
 */
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per interval
});

export default limiter;
