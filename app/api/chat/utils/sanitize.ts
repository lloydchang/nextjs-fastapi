// File: app/api/chat/utils/sanitize.ts

import logger from './log';

export function sanitizeInput(input: string): string {
  const sanitized = input.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
  logger.silly(`app/api/chat/utils/sanitize.ts - Sanitized input: ${sanitized}`);
  return sanitized;
}
