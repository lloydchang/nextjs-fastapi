// File: app/api/chat/utils/logger.ts

import { createLogger, format, transports, addColors } from 'winston';

// Define custom log levels and colors
const colors = {
  debug: 'brightBlue',
};

// Apply custom colors to Winston
addColors(colors);

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOGGER_LEVEL || 'info', // Default log level to 'silly' if not set
  format: format.combine(
    format((info) => {
      info.level = info.level.toUpperCase(); // Convert log level to uppercase
      return info;
    })(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }), // Match timestamp format to `%(asctime)s` in Python
    format.colorize({ all: true }), // Colorize log level and message
    format.printf(({ timestamp, level, message }) => `${timestamp} - ${level} - ${message}`)
  ),
  transports: [new transports.Console()],
});

// Log an initialization message to confirm logger setup
logger.silly('Logger initialized successfully from app/api/chat/utils/logger.ts');

export default logger;
