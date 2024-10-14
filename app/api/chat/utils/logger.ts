// File: app/api/chat/utils/logger.ts

import { createLogger, format, transports, addColors } from 'winston';
import { getConfig } from 'app/api/chat/utils/config';

// Define custom log levels and colors
const colors = {
  debug: 'brightBlue',
  silly: 'magenta',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  verbose: 'cyan',
  http: 'white',
};

// Apply custom colors to Winston
addColors(colors);

const { winstonLoggerLevel } = getConfig();

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: winstonLoggerLevel,
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
// logger.silly('app/api/chat/utils/logger.ts - Logger initialized successfully');

export default logger;
