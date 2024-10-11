// File: types.ts

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string; // Ensure text is always a string
  persona?: string;
  hidden?: boolean;
  isInterim?: boolean; // Optional property for interim status
  role: string;
  content: string;
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

  // File: components/state/types.ts

export interface Talk {
  title: string;
  description?: string;         // Optional property
  presenter?: string;           // Optional property
  sdg_tags: string[];
  similarity_score?: number;    // Optional property
  url: string;
}

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
