// File: app/api/chat/utils/logger.ts

import { createLogger, format, transports, config } from 'winston';
import * as path from 'path';
import { getCallerFile } from './loggerHelper';

/**
 * Custom format to add filename and line number.
 */
const addFilePathFormat = format((info) => {
  const callerLocation = getCallerFile();
  if (callerLocation) {
    const [fullPath, line] = callerLocation.split(':');
    info.file = path.basename(fullPath) || 'unknown'; // Extract only the filename
    info.line = line || '0'; // Extract line number or default to 0
  } else {
    info.file = 'unknown';
    info.line = '0';
  }
  return info;
});

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOG_LEVEL || 'info', // Default log level to 'info'
  format: format.combine(
    format((info) => {
      // Convert log level to uppercase (e.g., `info` -> `INFO`, `error` -> `ERROR`)
      info.level = info.level.toUpperCase();
      return info;
    })(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }), // Match timestamp format to `%(asctime)s` in Python
    addFilePathFormat(), // Add filename and line number to each log entry
    format.colorize({ all: true }), // Colorize the log level and message
    format.printf(({ timestamp, level, message, file, line }) => {
      return `${timestamp} - ${file}:${line} - ${level} - ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to the console
  ],
});

// Test log messages to verify the configuration in the specified order
logger.error("This is an error message, colored in red.");
logger.warn("This is a warning message, colored in yellow."); // Changed to `warn` instead of `warning`
logger.info("This is an info message, colored in green.");
logger.http("This is an HTTP message, colored in green.");
logger.verbose("This is a verbose message, colored in cyan.");
logger.debug("This is a debug message, colored in blue.");
logger.silly("This is a silly message, colored in magenta.");

// Log an initialization message
logger.info('Logger initialized from app/api/chat/utils/logger.ts');

// Display Winston's default log levels and colors
console.log("Winston's Default Log Levels:", config.npm.levels);
console.log("Winston's Default Log Level Colors:", config.npm.colors);

export default logger;
