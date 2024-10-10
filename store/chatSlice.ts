// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from 'store/store';
import he from 'he'; // For HTML entity decoding
import { Message } from 'types'; // Import the unified Message type

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
    saveMessage: (state, action: PayloadAction<{ text: string; sender?: 'user' | 'bot'; hidden?: boolean; persona?: string }>) => {
      // Construct the new message and use the addMessage reducer to add it to the state
      const newMessage: Message = {
        id: `${Date.now()}`,
        sender: action.payload.sender || 'bot',
        text: action.payload.text,
        persona: action.payload.persona,
        hidden: action.payload.hidden || false,
      };
      state.messages.push(newMessage);
    },
  },
});

// Async function to send a message and get a response from the API
export const sendMessage = (input: string | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }) => async (dispatch: AppDispatch) => {
  // Determine if the input is a string or an object
  const userMessage: Message = typeof input === 'string' 
    ? { id: `${Date.now()}`, sender: 'user', text: input }
    : { id: `${Date.now()}`, sender: input.sender || 'user', text: input.text, hidden: input.hidden || false, persona: input.persona };

  // Dispatch the user message to the chat
  dispatch(addMessage(userMessage));

  try {
    // Prepare the message array for the API request
    const messagesArray = [{ role: 'user', content: userMessage.text.trim() }];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messagesArray }),
    });

    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let chunk;
      let textBuffer = '';

      // Handle streaming responses
      while ((chunk = await reader.read()) && !chunk.done) {
        textBuffer += decoder.decode(chunk.value, { stream: true });
        const completeMessages = textBuffer.split('\n\n').filter((msg) => msg.trim() !== '');

        for (const message of completeMessages) {
          if (message.startsWith('data: ')) {
            const jsonString = message.substring(6).trim();
            console.log(`chatSlice - Raw incoming message: ${jsonString}`);

            try {
              const parsedData = parseIncomingMessage(jsonString);
              if (parsedData?.message && parsedData?.persona) {
                const botMessage: Message = { 
                  id: `${Date.now()}`, 
                  sender: 'bot', 
                  text: parsedData.message,
                  persona: parsedData.persona
                };
                dispatch(addMessage(botMessage));
              }
            } catch (e) {
              console.error('chatSlice - Error parsing incoming event message:', jsonString, e);
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
