// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from 'store/store';
import he from 'he'; // For HTML entity decoding
import { Message } from 'types'; // Import the unified Message type
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 for client ID generation

// Define the ChatState interface
interface ChatState {
  messages: Message[];
}

// Initial state for the chat slice
const initialState: ChatState = {
  messages: [],
};

// Create the chat slice with updated action names
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    saveMessage: (
      state,
      action: PayloadAction<{
        text: string;
        sender?: 'user' | 'bot';
        hidden?: boolean;
        persona?: string;
      }>
    ) => {
      const newMessage: Message = {
        id: `${Date.now()}`,
        sender: action.payload.sender || 'bot',
        text: action.payload.text,
        role: action.payload.sender === 'user' ? 'user' : 'bot', // Add role field
        content: action.payload.text, // Add content field matching text
        persona: action.payload.persona,
        hidden: action.payload.hidden || false,
      };
      state.messages.push(newMessage);
    },
  },
});

// Async function to send a message and get a response from the API
export const sendMessage = (
  input:
    | string
    | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }
) => async (dispatch: AppDispatch) => {
  console.log('sendMessage - Function called with input:', input); // Added logging

  // Generate or retrieve the client ID
  let clientId: string;
  if (typeof window !== 'undefined') {
    clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);
  } else {
    clientId = uuidv4(); // Fallback for server environment, though this code shouldn't run server-side
  }

  const userMessage: Message =
    typeof input === 'string'
      ? { id: `${Date.now()}`, sender: 'user', text: input, role: 'user', content: input }
      : {
          id: `${Date.now()}`,
          sender: input.sender || 'user',
          text: input.text,
          role: 'user',
          content: input.text,
          hidden: input.hidden || false,
          persona: input.persona,
        };

  dispatch(addMessage(userMessage));

  try {
    const messagesArray = [{ role: 'user', content: userMessage.text.trim() }];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId, // Include client ID in headers
      },
      body: JSON.stringify({ messages: messagesArray }),
    });

    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let textBuffer = ''; // Accumulate the response chunks here

      // Handle streaming responses
      while (true) {
        const { value, done } = await reader.read();
        if (done) break; // Exit the loop if streaming is complete

        // Decode the current chunk and add it to the buffer
        textBuffer += decoder.decode(value, { stream: true });

        // Process each complete message (separated by \n\n) from the buffer
        const messages = textBuffer.split('\n\n');
        textBuffer = messages.pop() || ''; // Save the last incomplete message back to the buffer

        // Process each complete message from the buffer
        for (const message of messages) {
          if (message.startsWith('data: ')) {
            const jsonString = message.substring(6).trim(); // Strip out 'data: ' prefix
            console.log(`chatSlice - Raw incoming message: ${jsonString}`);

            try {
              const parsedData = parseIncomingMessage(jsonString);
              if (parsedData?.message && parsedData?.persona) {
                const botMessage: Message = {
                  id: `${Date.now()}`,
                  sender: 'bot',
                  text: parsedData.message,
                  role: 'bot',
                  content: parsedData.message,
                  persona: parsedData.persona,
                };
                dispatch(addMessage(botMessage)); // Add bot response to the Redux state
              }
            } catch (e) {
              console.error(
                'chatSlice - Error parsing incoming event message:',
                jsonString,
                e
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`chatSlice - Error sending message to API: ${error}`);
  }
};

// Function to parse incoming messages from the API
export function parseIncomingMessage(jsonString: string) {
  try {
    // Decode HTML entities and special characters using `he`
    const sanitizedString = he.decode(jsonString);
    const parsedData = JSON.parse(sanitizedString);

    if (!parsedData.persona || !parsedData.message) {
      console.error(`chatSlice - Incomplete message data received: ${sanitizedString}`);
      return null;
    }

    return parsedData;
  } catch (error) {
    logDetailedErrorInfo(jsonString, error as Error);
    return null;
  }
}

// Function to log detailed error information
function logDetailedErrorInfo(jsonString: string, error: Error) {
  console.error(`chatSlice - Error Type: ${error.name}`);
  console.error(`chatSlice - Error Message: ${error.message}`);
  const snippetLength = 100;
  const startSnippet = jsonString.slice(0, snippetLength);
  const endSnippet = jsonString.slice(-snippetLength);

  console.error('chatSlice - JSON Snippet (Start):', startSnippet);
  console.error('chatSlice - JSON Snippet (End):', endSnippet);
}

// Export the reducer and actions
export const { addMessage, clearMessages, saveMessage } = chatSlice.actions;
export default chatSlice.reducer;
