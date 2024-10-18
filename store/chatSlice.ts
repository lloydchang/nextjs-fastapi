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

function isMessage(input: any): input is Partial<Message> {
  const isValid = typeof input === 'object' && input !== null && 'sender' in input;
  console.debug('[isMessage] Validation result:', isValid, 'Input:', input);
  return isValid;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      console.debug('[addMessage] Incoming message:', action.payload);
      console.debug('[addMessage] Current state:', state);

      const isDuplicate = state.messages.some(
        (msg) =>
          msg.text === action.payload.text &&
          msg.timestamp === action.payload.timestamp
      );

      if (isDuplicate) {
        console.warn('[addMessage] Duplicate message detected, skipping:', action.payload);
        return;
      }

      if (state.messages.length >= MAX_MESSAGES) {
        console.debug('[addMessage] Max messages reached. Removing oldest message:', state.messages[0]);
        state.messages.shift();
      }

      state.messages.push(action.payload);
      console.debug('[addMessage] Updated messages:', [...state.messages]);
    },
    clearMessages: (state) => {
      console.info('[clearMessages] Clearing all messages. Previous messages:', state.messages);
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      console.error('[setError] Setting error:', action.payload);
      state.error = action.payload;
    },
    clearError: (state) => {
      console.info('[clearError] Clearing error. Previous error:', state.error);
      state.error = null;
    },
  },
});

const wait = (ms: number) =>
  new Promise((resolve) => {
    console.debug(`[wait] Waiting for ${ms}ms`);
    setTimeout(resolve, ms);
  });

const timeoutPromise = (ms: number) =>
  new Promise<Response>((_, reject) =>
    setTimeout(() => {
      console.warn('[timeoutPromise] Timeout reached:', ms);
      reject(new Error('Timeout'));
    }, ms)
  );

export const parseIncomingMessage = (jsonString: string) => {
  console.debug('[parseIncomingMessage] Raw JSON:', jsonString);
  try {
    if (jsonString === '[DONE]') {
      console.debug('[parseIncomingMessage] Received [DONE] signal.');
      return null;
    }

    const sanitizedString = he.decode(jsonString);
    const parsedData = JSON.parse(sanitizedString);

    console.debug('[parseIncomingMessage] Parsed data:', parsedData);
    if (!parsedData.persona || !parsedData.message) {
      console.warn('[parseIncomingMessage] Missing persona or message.');
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('[parseIncomingMessage] Error parsing JSON:', jsonString, error);
    return null;
  }
};

const debouncedApiCall = debounce(
  async (dispatch: AppDispatch, getState: () => RootState, input: string | Partial<Message>, clientId: string) => {
    console.info('[debouncedApiCall] Initiating API call with input:', input);

    const state = getState();
    console.debug('[debouncedApiCall] Current state:', state);

    if (state.api?.isLoading) {
      console.warn('[debouncedApiCall] API is already loading. Aborting.');
      return;
    }

    dispatch(setLoading(true));
    dispatch(clearApiError());

    const messagesArray = [{ role: 'user', content: typeof input === 'string' ? input : input.text }];
    console.debug('[debouncedApiCall] Messages payload:', messagesArray);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.info(`[debouncedApiCall] Attempt ${retryCount + 1} to send API request.`);

        const response = await Promise.race([
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
            body: JSON.stringify({ messages: messagesArray }),
          }),
          timeoutPromise(10000),
        ]);

        console.debug('[debouncedApiCall] API response:', response);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
            console.warn('[debouncedApiCall] Rate limit reached. Retrying after', retryAfter, 'seconds.');
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
                      timestamp: Date.now(),
                    };
                    console.info('[debouncedApiCall] Dispatching bot message:', botMessage);
                    dispatch(addMessage(botMessage));
                  }
                }
              }
            }
          } finally {
            console.debug('[debouncedApiCall] Releasing reader lock.');
            reader.releaseLock();
          }
        }

        dispatch(setLoading(false));
        return;
      } catch (error: any) {
        console.error('[debouncedApiCall] Error during API call:', error);

        if (error instanceof ApiError && error.status === 429) {
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

export const sendMessage =
  (input: string | Partial<Message>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    console.info('[sendMessage] Sending user message:', input);

    dispatch(clearError());

    const clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);

    console.debug('[sendMessage] Client ID:', clientId);

    const userMessage: Message = {
      id: uuidv4(),
      sender: isMessage(input) ? input.sender || 'user' : 'user',
      text: isMessage(input) ? input.text || '' : input.toString(),
      role: isMessage(input) ? input.role || 'user' : 'user',
      content: isMessage(input) ? input.text || '' : input.toString(),
      hidden: isMessage(input) ? input.hidden || false : false,
      persona: isMessage(input) ? input.persona || '' : '',
      timestamp: Date.now(),
    };

    console.info('[sendMessage] Dispatching user message:', userMessage);
    dispatch(addMessage(userMessage));

    try {
      await debouncedApiCall(dispatch, getState, input, clientId);
    } catch (error) {
      console.error('[sendMessage] Error sending message:', error);
      dispatch(setApiError('Failed to send message.'));
    }
  };

export const { addMessage, clearMessages, setError, clearError } = chatSlice.actions;
export default chatSlice.reducer;
