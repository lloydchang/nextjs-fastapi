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
      const existingMessage = state.messages.find((msg) => msg.id === action.payload.id);
      if (!existingMessage) {
        state.messages.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const debouncedApiCall = debounce(
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
    input: any,
    clientId: string
  ): Promise<void> => {
    const state = getState();
    if (state.api?.isLoading) {
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const messagesArray = [{ role: 'user', content: typeof input === 'string' ? input : input.text }];

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
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
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
                try {
                  const parsedData = parseIncomingMessage(jsonString);
                  if (parsedData?.message && parsedData?.persona) {
                    const botMessage: Message = {
                      id: uuidv4(),
                      sender: 'bot',
                      text: parsedData.message,
                      role: 'bot',
                      content: parsedData.message,
                      persona: parsedData.persona,
                    };
                    dispatch(addMessage(botMessage));
                  }
                } catch (e) {
                  console.error('Error parsing incoming message:', jsonString, e);
                }
              }
            }
          }
        }
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          await wait(Math.pow(2, retryCount) * 1000); // Exponential backoff
          continue;
        }
        return;
      }
    }
  },
  1000 // Debounce time: 1 second, resulting in exponential backoff of 2, 4, 8 seconds
);

export const sendMessage = (
  input:
    | string
    | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(clearError());

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
          id: uuidv4(), // Use UUID for unique IDs
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

  await debouncedApiCall(dispatch, getState, input, clientId);
};

export function parseIncomingMessage(jsonString: string) {
  try {
    // Ignore the "[DONE]" message
    if (jsonString === '[DONE]') {
      return null; // Returning null or similar to signal the end of the stream
    }

    const sanitizedString = he.decode(jsonString);
    const parsedData = JSON.parse(sanitizedString);

    if (!parsedData.persona || !parsedData.message) {
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing message:', jsonString, error);
    return null;
  }
}

export const { addMessage, clearMessages, setError, clearError } = chatSlice.actions;
export default chatSlice.reducer;
