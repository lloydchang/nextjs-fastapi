// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './store'; // Adjust the import path if necessary
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import throttle from 'lodash/throttle'; // Import throttle
import { setLoading } from './apiSlice'; // Import setLoading
import { showNotification } from './notificationSlice'; // Import showNotification

interface ChatState {
  messages: Message[];
}

const initialState: ChatState = {
  messages: [],
};

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
        id: uuidv4(), // Use UUID for uniqueness
        sender: action.payload.sender || 'bot',
        text: action.payload.text,
        role: action.payload.sender === 'user' ? 'user' : 'bot',
        content: action.payload.text,
        persona: action.payload.persona,
        hidden: action.payload.hidden || false,
      };
      state.messages.push(newMessage);
    },
  },
});

// Destructure and export all actions at once to avoid duplication
export const { addMessage, clearMessages, saveMessage } = chatSlice.actions;

const throttledApiCall = throttle(
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
    input: any,
    clientId: string
  ): Promise<void> => {
    // Check if an API call is already in progress
    const state = getState();

    if (state.api?.isLoading) {
      console.log('API call already in progress, skipping');
      return;
    }

    // Set loading to true
    dispatch(setLoading(true));

    try {
      const messagesArray = [
        { role: 'user', content: typeof input === 'string' ? input : input.text },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({ messages: messagesArray }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting
          const retryAfter = response.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60; // Default to 60 seconds

          dispatch(
            showNotification({
              message: `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`,
              type: 'warning',
            })
          );

          console.error(`chatSlice - Rate limit exceeded: ${response.statusText}`);
          return;
        }

        // Handle other error statuses
        dispatch(
          showNotification({
            message: `Error: ${response.status} - ${response.statusText}`,
            type: 'error',
          })
        );

        console.error(`chatSlice - Error response from API: ${response.statusText}`);
        throw new Error(response.statusText);
      }

      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let textBuffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          const messages = textBuffer.split('\n\n');
          textBuffer = messages.pop() || '';

          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const jsonString = message.substring(6).trim();
              console.log(`chatSlice - Raw incoming message: ${jsonString}`);

              try {
                const parsedData = parseIncomingMessage(jsonString);
                if (parsedData?.message && parsedData?.persona) {
                  const botMessage: Message = {
                    id: uuidv4(), // Use UUID for uniqueness
                    sender: 'bot',
                    text: parsedData.message,
                    role: 'bot',
                    content: parsedData.message,
                    persona: parsedData.persona,
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
      if (error instanceof Error) {
        dispatch(
          showNotification({
            message: `An error occurred: ${error.message}`,
            type: 'error',
          })
        );
      } else {
        dispatch(
          showNotification({
            message: 'An unexpected error occurred.',
            type: 'error',
          })
        );
      }
      console.error(`chatSlice - Error sending message to API: ${error}`);
    } finally {
      // Reset loading state
      dispatch(setLoading(false));
    }
  },
  1000, // Throttle limit: 1000 milliseconds (1 second)
  { leading: true, trailing: false } // Options: execute on the leading edge only
);

export const sendMessage = (
  input:
    | string
    | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  console.log('sendMessage - Function called with input:', input);

  let clientId: string;
  if (typeof window !== 'undefined' && window.localStorage) {
    clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);
  } else {
    clientId = uuidv4();
  }

  const userMessage: Message =
    typeof input === 'string'
      ? {
          id: uuidv4(),
          sender: 'user',
          text: input,
          role: 'user',
          content: input,
        }
      : {
          id: uuidv4(),
          sender: input.sender || 'user',
          text: input.text,
          role: 'user',
          content: input.text,
          hidden: input.hidden || false,
          persona: input.persona,
        };

  dispatch(addMessage(userMessage));

  // Call the throttled API call (no need to await since throttling controls execution)
  throttledApiCall(dispatch, getState, input, clientId);
};

export function parseIncomingMessage(jsonString: string) {
  try {
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

function logDetailedErrorInfo(jsonString: string, error: Error) {
  console.error(`chatSlice - Error Type: ${error.name}`);
  console.error(`chatSlice - Error Message: ${error.message}`);
  const snippetLength = 100;
  const startSnippet = jsonString.slice(0, snippetLength);
  const endSnippet = jsonString.slice(-snippetLength);

  console.error('chatSlice - JSON Snippet (Start):', startSnippet);
  console.error('chatSlice - JSON Snippet (End):', endSnippet);
}

export default chatSlice.reducer;
