// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';
import { setLoading, setApiError, clearApiError } from './apiSlice';
import { processLocalQnA } from '../utils/tensorflowQnA';

// ChatState interface definition
interface ChatState {
  messages: Message[];
  error: string | null;
}

const MAX_MESSAGES = 100;

const initialState: ChatState = {
  messages: [],
  error: null,
};

// Custom error class for API errors
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type guard function to validate if input is Partial<Message>
function isMessage(input: any): input is Partial<Message> {
  return typeof input === 'object' && input !== null && 'sender' in input;
}

// Redux slice definition
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      console.debug('Adding message:', action.payload);

      if (
        state.messages.some(
          (msg) =>
            msg.text === action.payload.text &&
            msg.timestamp === action.payload.timestamp
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
      console.debug('Updated message list:', [...state.messages]);
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
  new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );

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
    input: string | Partial<Message>,
    clientId: string
  ) => {
    const state = getState();
    if (state.api?.isLoading) return;

    dispatch(setLoading(true));
    dispatch(clearApiError());

    const userMessageContent =
      typeof input === 'string' ? input : input.text || '[No content provided]';

    const messagesArray = [
      {
        sender: 'user',
        role: 'user',
        content: userMessageContent,
        timestamp: Date.now(),
      },
    ];

    console.debug('Prepared API request payload:', JSON.stringify({ messages: messagesArray }, null, 2));

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const tfPredictionMessages = await processLocalQnA(input.toString(), '');
        const tfPredictionText =
          tfPredictionMessages.length > 0
            ? tfPredictionMessages[0].text
            : 'No answer found';

        const botMessageFromTF: Message = {
          id: uuidv4(),
          sender: 'bot',
          text: tfPredictionText,
          role: 'bot',
          content: tfPredictionText,
          persona: 'tf-model',
          timestamp: Date.now(),
        };
        dispatch(addMessage(botMessageFromTF));

        const [tfResult, apiResult] = await Promise.allSettled([
          processLocalQnA(input.toString(), ''),
          (async () => {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-client-id': clientId,
              },
              body: JSON.stringify({ messages: messagesArray }),
            });

            console.debug('API Response Status:', response.status);

            const responseBody = await response.text();
            console.debug('API Response Body:', responseBody);

            if (!response.ok) {
              if (response.status === 429) {
                const retryAfter = parseInt(
                  response.headers.get('Retry-After') || '1',
                  10
                );
                console.debug(`Rate limit hit, retrying after ${retryAfter} seconds...`);
                await wait(retryAfter * 1000);
                throw new ApiError(response.status, 'Retrying...');
              }
              throw new ApiError(response.status, responseBody);
            }

            return JSON.parse(responseBody);
          })(),
          timeoutPromise(10000),
        ]);

        if (tfResult.status === 'fulfilled') {
          const tfMessages = tfResult.value.map((answer: any) => ({
            id: uuidv4(),
            sender: 'bot' as 'bot',
            text: answer.text,
            role: 'bot' as 'bot',
            content: answer.text,
            persona: 'tensorflow-qna',
            timestamp: Date.now(),
          }));
          tfMessages.forEach((msg) => dispatch(addMessage(msg)));
        }

        if (apiResult.status === 'fulfilled') {
          const apiMessage: Message = {
            id: uuidv4(),
            sender: 'bot',
            text: apiResult.value.answer,
            role: 'bot',
            content: apiResult.value.answer,
            persona: 'api-bot',
            timestamp: Date.now(),
          };
          dispatch(addMessage(apiMessage));
        }

        dispatch(setLoading(false));
        return;

      } catch (error: any) {
        console.error('Error during API or TensorFlow.js call:', error);
        if (error instanceof ApiError && error.status === 429) {
          retryCount++;
          const retryDelay = Math.pow(2, retryCount) * 1000;
          console.debug(`Retrying API call, attempt ${retryCount} after ${retryDelay}ms...`);
          await wait(retryDelay);
          continue;
        }
        dispatch(setApiError(error.message || 'An unknown error occurred'));
        dispatch(setLoading(false));
        return;
      }
    }

    console.error('Max retries reached. Giving up.');
    dispatch(setApiError('Failed to get a response after multiple attempts.'));
    dispatch(setLoading(false));
  },
  1000
);

export const sendMessage =
  (input: string | Partial<Message>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(clearError());

    const clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);

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

    console.debug('Dispatching user message:', userMessage);
    dispatch(addMessage(userMessage));

    try {
      await debouncedApiCall(dispatch, getState, input, clientId);
    } catch (error) {
      dispatch(setApiError('Failed to send message.'));
    }
  };

export const { addMessage, clearMessages, setError, clearError } =
  chatSlice.actions;
export default chatSlice.reducer;
