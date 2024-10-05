// File: app/api/chat/controllers/handleRateLimit.ts

import { NextResponse } from 'next/server';
import logger from '../utils/log';

const RATE_LIMIT = 100; // Example limit
const WINDOW_SIZE = 60 * 60 * 1000; // 1 hour in milliseconds
const ipMap = new Map<string, { count: number; startTime: number }>();

export function handleRateLimit(ip: string) {
  const currentTime = Date.now();
  const record = ipMap.get(ip);

  if (record) {
    if (currentTime - record.startTime < WINDOW_SIZE) {
      if (record.count >= RATE_LIMIT) {
        logger.warn(`app/api/chat/controllers/handleRateLimit.ts - Rate limit exceeded for IP: ${ip}`);
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      record.count += 1;
    } else {
      record.count = 1;
      record.startTime = currentTime;
    }
  } else {
    ipMap.set(ip, { count: 1, startTime: currentTime });
  }

  logger.info(`app/api/chat/controllers/handleRateLimit.ts - IP: ${ip} request count: ${record?.count || 1}`);
  return null;
}
