// File: utils/logger.ts

import winston from 'winston';

/**
 * Initializes and exports the logger.
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Add file transports or other transports as needed
  ],
});

export default logger;
