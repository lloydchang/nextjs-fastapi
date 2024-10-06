// File: app/api/chat/utils/logger.ts

import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import { getCallerFile } from './loggerHelper';

/**
 * Custom format to add filename and line number.
 */
const addFilePathFormat = format((info) => {
  const callerLocation = getCallerFile();
  if (callerLocation) {
    const [fullPath, line] = callerLocation.split(':');
    info.file = path.basename(fullPath); // Extract only the filename
    info.line = line; // Extract line number
  } else {
    info.file = 'unknown';
    info.line = 'unknown';
  }
  return info;
});

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: process.env.WINSTON_LOG_LEVEL || 'info', // Use WINSTON_LOG_LEVEL; default to 'info'
  format: format.combine(
    format((info) => {
      // Convert log level to uppercase (e.g., `info` -> `INFO`, `error` -> `ERROR`)
      info.level = info.level.toUpperCase();
      return info;
    })(),
    addFilePathFormat(), // Add filename and line number to each log entry
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }), // Match timestamp format to `%(asctime)s` in Python
    format.printf(
      ({ timestamp, level, message, file, line }) =>
        `${timestamp} - ${file}:${line} - ${level} - ${message}`
    ) // Match Python log format: `%(asctime)s - %(filename)s:%(lineno)d - %(levelname)s - %(message)s`
  ),
  transports: [
    new transports.Console(), // Log to the console
  ],
});

// Log an initialization message
logger.info('Logger initialized from app/api/chat/utils/logger.ts');

export default logger;
