// File: app/api/chat/utils/log.ts

import { createLogger, format, transports } from 'winston';

/**
 * Creates a centralized logger using the `winston` library.
 */
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new transports.Console()],
});

export default logger;
