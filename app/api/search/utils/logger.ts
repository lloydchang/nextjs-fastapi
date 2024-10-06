// File: app/api/search/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

logger.info('Logger initialized.');
