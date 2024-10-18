// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';
import { setLoading, setApiError, clearApiError } from './apiSlice';
import { processLocalQnA } from 'utils/tensorflowQnA'; // Import TensorFlow QnA

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

// Type guard to check if the input is of type Partial<Message>
function isMessage(input: any): input is Partial<Message> {
  console.debug('Checking if input is a valid message:', input);
  return typeof input === 'object' && input !== null && 'sender' in input;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      console.debug('Attempting to add message:', action.payload);

      if (
        state.messages.some(
          (msg) =>
            msg.text === action.payload.text &&
            msg.timestamp === action.payload.timestamp
        )
      ) {
        console.debug('Duplicate message detected. Skipping:', action.payload);
        return;
      }

      if (state.messages.length >= MAX_MESSAGES) {
        console.debug('Max message limit reached. Removing oldest message:', state.messages[0]);
        state.messages.shift();
      }

      state.messages.push(action.payload);
      console.debug('Message added. Updated message list:', [...state.messages]);
    },
    clearMessages: (state) => {
      console.debug('Clearing all messages.');
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      console.debug(`Setting error: "${action.payload}"`);
      state.error = action.payload;
    },
    clearError: (state) => {
      console.debug('Clearing error.');
      state.error = null;
    },
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const timeoutPromise = (ms: number) =>
  new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout occurred')), ms)
  );

export const parseIncomingMessage = (jsonString: string) => {
  console.debug('Parsing incoming message string:', jsonString);
  try {
    if (jsonString === '[DONE]') {
      console.debug('Received termination signal "[DONE]".');
      return null;
    }

    const sanitizedString = he.decode(jsonString);
    console.debug('Sanitized message string:', sanitizedString);

    const parsedData = JSON.parse(sanitizedString);
    console.debug('Parsed message data:', parsedData);

    if (!parsedData.persona || !parsedData.message) {
      console.debug('Message data is incomplete. Skipping:', parsedData);
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing message:', error);
    return null;
  }
};

// Add simultaneous processing of local QnA and API calls
const simultaneousProcessing = async (
  dispatch: AppDispatch,
  getState: () => RootState,
  input: string | Partial<Message>,
  clientId: string
) => {
  const context = getState().chat.messages.map((msg) => msg.content).join('\n');

  try {
    const localMessages = await processLocalQnA(input.toString(), context);
    localMessages.forEach((msg) => dispatch(addMessage(msg)));
  } catch (error) {
    console.error('Local QnA error:', error);
    dispatch(setApiError('Error processing local QnA model.'));
  }
};

const debouncedApiCall = debounce(
  async (
    dispatch: AppDispatch,
    getState: () => RootState,
    input: string | Partial<Message>,
    clientId: string
  ) => {
    console.debug('Starting API call with input:', input);

    const state = getState();
    if (state.api?.isLoading) {
      console.debug('API is currently loading. Aborting request.');
      return;
    }

    dispatch(setLoading(true));
    dispatch(clearApiError());

    const messagesArray = [
      { role: 'user', content: typeof input === 'string' ? input : input.text },
    ];

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      console.debug(`API call attempt ${retryCount + 1}.`);

      try {
        const response = await Promise.race([
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
            body: JSON.stringify({ messages: messagesArray }),
          }),
          timeoutPromise(3600000) // Timeout set to 1 hour which is 3600000 milliseconds
        ]);

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
                  dispatch(addMessage(botMessage));
                }
              }
            }
          }
          reader.releaseLock();
        }

        dispatch(setLoading(false));
        return;
      } catch (error: any) {
        if (error instanceof ApiError && error.status === 429) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          await wait(waitTime);
          retryCount++;
          continue;
        }
        dispatch(setApiError(error.message || 'Unknown error occurred'));
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
    const clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);

    const userMessage: Message = {
      id: uuidv4(),
      sender: isMessage(input) ? input.sender || 'user' : 'user',
      text: isMessage(input) ? input.text || '' : input.toString(),
      role: 'user',
      content: input.toString(),
      timestamp: Date.now(),
    };

    dispatch(addMessage(userMessage));

    await simultaneousProcessing(dispatch, getState, input, clientId);
    await debouncedApiCall(dispatch, getState, input, clientId);
  };

export const { addMessage, clearMessages, setError, clearError } =
  chatSlice.actions;
export default chatSlice.reducer;
