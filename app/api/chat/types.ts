// File: app/api/chat/types.ts

/**
 * Interface representing a response segment for streamed responses.
 */
export interface ResponseSegment {
    message: string;
    context: string | null;
  }
  