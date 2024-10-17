// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';
import { setLoading, setApiError, clearApiError } from './apiSlice';

interface ChatState {
  messages: Message[];
  error: string | null;
}

const MAX_MESSAGES = 100;

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
      console.debug('Adding message:', action.payload);

      // **Update**: Check both text and timestamp to avoid duplicate filtering
      if (
        state.messages.some(
          (msg) =>
            msg.text === action.payload.text && msg.timestamp === action.payload.timestamp
        )
      ) {
        console.debug('Duplicate message detected, skipping:', action.payload);
        return;
      }

      if (state.messages.length >= MAX_MESSAGES) {
        console.debug('Reached max messages. Removing oldest message.');
        state.messages.shift();
      }

      state.messages.push(action.payload);
      console.debug('Updated message list:', state.messages);
    },
    clearMessages: (state) => {
      console.debug('Clearing all messages');
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      console.debug('Setting error:', action.payload);
      state.error = action.payload;
    },
    clearError: (state) => {
      console.debug('Clearing error');
      state.error = null;
    },
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const timeoutPromise = (ms: number) =>
  new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

export const parseIncomingMessage = (jsonString: string) => {
  try {
    if (jsonString === '[DONE]') return null;

    const sanitizedString = he.decode(jsonString);
    const parsedData = JSON.parse(sanitizedString);

    if (!parsedData.persona || !parsedData.message) return null;

    console.debug('Parsed incoming message:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error parsing message:', jsonString, error);
    return null;
  }
};

const debouncedApiCall = debounce(
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
    input: string | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string },
    clientId: string
  ) => {
    const state = getState();
    if (state.api?.isLoading) return;

    dispatch(setLoading(true));
    dispatch(clearApiError());

    const messagesArray = [{ role: 'user', content: typeof input === 'string' ? input : input.text }];
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await Promise.race([
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
            body: JSON.stringify({ messages: messagesArray }),
          }),
          timeoutPromise(10000),
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
                    const botMessage: Message = {
                      id: uuidv4(),
                      sender: 'bot',
                      text: parsedData.message,
                      role: 'bot',
                      content: parsedData.message,
                      persona: parsedData.persona,
                      timestamp: Date.now(), // Ensure timestamp for all messages
                    };
                    dispatch(addMessage(botMessage));
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }

        dispatch(setLoading(false));
        return;
      } catch (error: any) {
        if ((error instanceof ApiError && error.status === 429) || error.message === 'Timeout') {
          retryCount++;
          await wait(Math.pow(2, retryCount) * 1000);
          continue;
        }
        dispatch(setApiError(error.message || 'An unknown error occurred'));
        dispatch(setLoading(false));
        return;
      }
    }
  },
  1000
);

export const sendMessage = (
  input: string | { text: string; hidden?: boolean; sender?: 'user' | 'bot'; persona?: string }
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(clearError());

  const clientId = localStorage.getItem('clientId') || uuidv4();
  localStorage.setItem('clientId', clientId);

  const userMessage: Message = {
    id: uuidv4(),
    sender: typeof input === 'string' ? 'user' : input.sender || 'user',
    text: typeof input === 'string' ? input : input.text || '',
    role: typeof input === 'string' ? 'user' : input.sender === 'bot' ? 'bot' : 'user',
    content: typeof input === 'string' ? input : input.text || '',
    hidden: typeof input === 'string' ? false : input.hidden,
    persona: typeof input === 'string' ? undefined : input.persona,
    timestamp: Date.now(), // Add timestamp to all outgoing messages
  };

  dispatch(addMessage(userMessage));

  try {
    await debouncedApiCall(dispatch, getState, input, clientId);
  } catch (error) {
    dispatch(setApiError('Failed to send message.'));
  }
};

export const { addMessage, clearMessages, setError, clearError } = chatSlice.actions;
export default chatSlice.reducer;
