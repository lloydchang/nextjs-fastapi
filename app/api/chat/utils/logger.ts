// File: app/api/chat/utils/logger.ts

import { createLogger, format, transports, addColors } from 'winston';

/**
 * Modify only the `debug` level color to `brightBlue`.
 */
const colors = {
  debug: 'brightBlue',
};

// Apply the updated color scheme to Winston
addColors(colors);

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOG_LEVEL || 'info',
  format: format.combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }), // Match timestamp format to `%(asctime)s` in Python
    format.colorize({ all: true }), // Colorize the log level and message
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level} - ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});

// Display Winston's default log levels and colors
// console.log("Winston's Default Log Levels:", config.npm.levels);
// console.log("Winston's Default Log Level Colors:", config.npm.colors);

// Test log messages to verify the configuration in the specified order
// logger.error("This is an error message.");
// logger.warn("This is a warning message.");
// logger.info("This is an info message.");
// logger.http("This is an HTTP message.");
// logger.verbose("This is a verbose message.");
// logger.debug("This is a debug message.");
// logger.silly("This is a silly message.");

// Log an initialization message
// logger.silly('Logger initialized from app/api/chat/utils/logger.ts');

export default logger;
