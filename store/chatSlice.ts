// File: app/api/chat/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';

interface ChatState {
  messages: Message[];
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  error: null,
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

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
        role: action.payload.sender === 'user' ? 'user' : 'bot',
        content: action.payload.text,
        persona: action.payload.persona,
        hidden: action.payload.hidden || false,
      };
      state.messages.push(newMessage);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

const { addMessage, setError, clearError } = chatSlice.actions;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const debouncedApiCall = debounce(
  (
    dispatch: AppDispatch,
    getState: () => RootState,
    input: any,
    clientId: string
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const state = getState();
      if (state.api?.isLoading) {
        console.log('API call already in progress, skipping');
        resolve();
        return;
      }

      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const messagesArray = [{ role: 'user', content: typeof input === 'string' ? input : input.text }];

          console.log('Attempting to fetch from /api/chat');
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-client-id': clientId,
            },
            body: JSON.stringify({ messages: messagesArray }),
          });

          console.log('Fetch response received:', response);

          if (!response.ok) {
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
              console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
              await wait(retryAfter * 1000);
              retryCount++;
              continue;
            }
            throw new ApiError(response.status, response.statusText);
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
                        id: `${Date.now()}`,
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
          resolve();
          return;
        } catch (error) {
          console.error('Error in API call:', error);
          
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('Network error or API endpoint is unreachable');
            dispatch(setError('Unable to reach the server. Please check your internet connection and try again.'));
          } else if (error instanceof ApiError && error.status === 429 && retryCount < maxRetries - 1) {
            retryCount++;
            await wait(Math.pow(2, retryCount) * 1000); // Exponential backoff
            continue;
          } else {
            console.error(`chatSlice - Error sending message to API: ${error}`);
            dispatch(setError(error instanceof Error ? error.message : 'Unknown error occurred'));
          }
          
          reject(error);
          return;
        }
      }

      dispatch(setError('Max retries reached. Please try again later.'));
      reject(new Error('Max retries reached'));
    });
  },
  300
);

export const sendMessage = (
  input:
    | string
    | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  console.log('sendMessage - Function called with input:', input);

  dispatch(clearError()); // Clear any previous errors

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
          id: `${Date.now()}`,
          sender: 'user',
          text: input,
          role: 'user',
          content: input,
        }
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

  // Wait for debouncedApiCall to complete
  await debouncedApiCall(dispatch, getState, input, clientId);
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

export const { clearMessages, saveMessage } = chatSlice.actions;
export default chatSlice.reducer;
