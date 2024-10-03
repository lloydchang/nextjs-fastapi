// File: types.ts

/**
 * Represents the request body structure for the chatbot API.
 */
export interface ChatbotRequestBody {
    model: string;
    prompt: string;
    temperature: number;
  }
  
  /**
   * Represents a segment of the response to be streamed back to the client.
   */
  export interface ResponseSegment {
    message: string;
    context: string | null;
  }
  