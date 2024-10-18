// File: types.ts

/**
 * Represents a user, system, bot, or nudge prompt in the conversation.
 */
export interface UserPrompt {
  role: 'system' | 'user' | 'bot' | 'nudge'; // Includes 'nudge' as a valid role
  content: string; // The text content of the prompt
  persona?: string; // Optional persona to attribute messages
}

/**
 * Represents a message in the conversation.
 */
export interface Message {
  id: string; // Unique identifier for the message
  sender: 'system' | 'user' | 'bot' | 'nudge'; // Includes 'nudge' as a valid sender
  text: string; // Always a string representing the message text
  persona?: string; // Optional persona to attribute messages
  hidden?: boolean; // If true, the message is hidden from the UI
  isInterim?: boolean; // Optional, indicates if the message is in progress
  role: 'system' | 'user' | 'bot' | 'nudge'; // Role of the message, including 'nudge'
  content: string; // Same as `text`, kept for structural consistency
  timestamp: number; // Timestamp of when the message was sent
}

/**
 * Represents the request body structure for the chatbot API.
 */
export interface ChatbotRequestBody {
  model: string; // AI model to use (e.g., GPT-3.5)
  prompt: UserPrompt[]; // Array of user, system, bot, or nudge prompts
  temperature: number; // Controls randomness of responses
}

/**
 * Represents a segment of the response streamed back to the client.
 */
export interface ResponseSegment {
  message: string; // Part of the response message
  context: string | null; // Optional additional context, if any
}

/**
 * Represents a TED Talk.
 */
export interface Talk {
  title: string; // Title of the TED Talk
  url: string; // URL of the TED Talk
  sdg_tags: string[]; // Tags related to Sustainable Development Goals (SDGs)
  presenterDisplayName: string; // Name of the presenter
  transcript: string; // Full transcript of the talk
}

/**
 * Defines the structure for each bot function.
 */
export interface BotFunction {
  persona: string; // Persona name for the bot function
  valid: boolean; // Indicates if the function is valid for execution
  generate: (this: BotFunction, currentContext: UserPrompt[]) => Promise<string | null>; 
  // Function to generate a response based on the current context
}

/**
 * Represents metrics collected during bot execution.
 */
export interface Metric {
  persona: string;
  duration: number;
  success: boolean;
  responseSize: number;
  error?: string;  // Optional error message if the bot execution fails
}
