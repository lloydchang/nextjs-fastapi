// File: app/api/chat/utils/log.ts

import { createLogger, format, transports } from 'winston';

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOG_LEVEL || 'silly', // Use WINSTON_LOG_LEVEL; default to 'silly'
  format: format.combine(
    format.colorize(), // Enable color output for better readability
    format.timestamp(), // Add timestamp to logs
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`) // Custom format for log messages
  ),
  transports: [
    new transports.Console(), // Log to the console
    // Optionally, you can add file transports for logging to files
    // new transports.File({ filename: 'combined.log' }),
    // new transports.File({ filename: 'error.log', level: 'error' })
  ],
});

export default logger;
