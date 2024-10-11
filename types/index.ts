// File: types/index.ts

export interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string; // Ensure text is always a string
    persona?: string;
    hidden?: boolean;
    isInterim?: boolean; // Optional property for interim status
  }
  
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
  
  /**
   * Represents a TED Talk.
   */
  export interface Talk {
    title: string;
    url: string;
    sdg_tags: string[];
  }
  