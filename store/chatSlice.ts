// File: store/chatSlice.ts

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

const MAX_MESSAGES = 100; // Limit messages to prevent memory growth

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
        if (state.messages.length >= MAX_MESSAGES) {
          state.messages.shift(); // Remove oldest message to control state size
        }
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

const timeoutPromise = (ms: number) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

const debouncedApiCall = debounce(async (dispatch: AppDispatch, getState: () => RootState, input: any, clientId: string) => {
  const state = getState();
  if (state.api.isLoading) return;

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const messagesArray = [{ role: 'user', content: input.text || input }];
      const response = await Promise.race([
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
          },
          body: JSON.stringify({ messages: messagesArray }),
        }),
        timeoutPromise(10000), // Timeout after 10 seconds
      ]);

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

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            textBuffer += decoder.decode(value, { stream: true });
            const messages = textBuffer.split('\n\n');
            textBuffer = messages.pop() || '';

            for (const message of messages) {
              if (message.startsWith('data: ')) {
                const parsedData = parseIncomingMessage(message.substring(6).trim());
                if (parsedData) {
                  dispatch(addMessage({
                    id: uuidv4(),
                    sender: 'bot',
                    text: parsedData.message,
                    role: 'bot',
                    content: parsedData.message,
                    persona: parsedData.persona,
                  }));
                }
              }
            }
          }
        } finally {
          reader.releaseLock(); // Ensure reader is released
        }
      }
      return;
    } catch (error) {
      if (error instanceof ApiError && error.status === 429 && retryCount < maxRetries - 1) {
        retryCount++;
        await wait(Math.pow(2, retryCount) * 1000); // Exponential backoff
        continue;
      }
      dispatch(setError(error.message));
      return;
    }
  }
}, 1000);

export const sendMessage = (input: string | { text: string }) => async (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(clearError());
  const clientId = localStorage.getItem('clientId') || uuidv4();
  localStorage.setItem('clientId', clientId);

  const userMessage: Message = {
    id: uuidv4(),
    sender: 'user',
    text: typeof input === 'string' ? input : input.text,
  };

  dispatch(addMessage(userMessage));
  await debouncedApiCall(dispatch, getState, input, clientId);
};

export const { addMessage, clearMessages, setError, clearError } = chatSlice.actions;
export default chatSlice.reducer;
