// File: app/api/chat/utils/log.ts

import { createLogger, format, transports } from 'winston';

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOG_LEVEL || 'debug', // Use WINSTON_LOG_LEVEL; default to 'debug'
  format: format.combine(
    format((info) => {
      info.level = info.level.toUpperCase(); // Convert the log level to uppercase
      return info;
    })(),
    format.colorize({ all: true }), // Apply colorize after the log level is converted to uppercase
    format.timestamp(), // Add timestamp to logs
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`) // Custom format for log messages
  ),
  transports: [
    new transports.Console(), // Log to the console
  ],
});

logger.info('app/api/chat/utils/log.ts - Logger initialized');

export default logger;
