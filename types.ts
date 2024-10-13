// File: types.ts

/**
 * Represents a user or system prompt in the conversation.
 */
export interface UserPrompt {
  role: 'system' | 'user' | 'bot';
  content: string;
}

/**
 * Represents a message in the conversation.
 */
export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string; // Always a string
  persona?: string;
  hidden?: boolean;
  isInterim?: boolean; // Optional property for interim status
  role: 'system' | 'user' | 'bot';
  content: string;
}

/**
 * Represents the request body structure for the chatbot API.
 */
export interface ChatbotRequestBody {
  model: string;
  prompt: UserPrompt[]; // Changed from string to array of UserPrompt
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
  transcript: string; // Add the transcript property here
}

/**
 * Defines the structure for each bot function.
 */
export interface BotFunction {
  persona: string;
  valid: boolean;
  generate: (this: BotFunction, currentContext: UserPrompt[]) => Promise<string | null>;
}
