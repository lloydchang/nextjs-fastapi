// File: app/api/chat/types.ts

import logger from './utils/log';

/**
 * Interface representing a response segment for streamed responses.
 */
export interface ResponseSegment {
  message: string;
  context: string | null;
}

logger.info('app/api/chat/types.ts - ResponseSegment interface defined');
