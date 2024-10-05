// File: app/api/chat/utils/log.ts

import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info', // Change to 'debug' for more detailed logs
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    // You can add file transports or other transports as needed
  ],
});

export default logger;
