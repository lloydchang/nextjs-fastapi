// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';
import { setLoading, setApiError, clearApiError } from './apiSlice';
import { processLocalQnA } from 'utils/tensorflowQnA';

// Debug logger utility
const debugLog = (component: string, action: string, data?: any) => {
  console.debug(`store/chatSlice.ts - [ChatSlice:${component}] ${action}`, data ? data : '');
};

interface ChatState {
  messages: Message[];
  error: string | null;
}

const MAX_MESSAGES = 100;

const initialState: ChatState = {
  messages: [],
  error: null,
};

debugLog('Init', 'Initializing chat slice with state:', initialState);

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    debugLog('ApiError', `Created new API error - Status: ${status}, Message: ${message}`);
  }
}

function isMessage(input: any): input is Partial<Message> {
  debugLog('TypeGuard', 'Checking message type for input:', input);
  const result = typeof input === 'object' && input !== null && 'sender' in input;
  debugLog('TypeGuard', `Type check result: ${result}`);
  return result;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      debugLog('Reducer:addMessage', 'Attempting to add message:', action.payload);

      const isDuplicate = state.messages.some(
        (msg) =>
          msg.text === action.payload.text &&
          msg.timestamp === action.payload.timestamp
      );

      if (isDuplicate) {
        debugLog('Reducer:addMessage', 'Duplicate message detected, skipping:', {
          existingMessage: state.messages.find(
            msg => msg.text === action.payload.text
          ),
          newMessage: action.payload
        });
        return;
      }

      if (state.messages.length >= MAX_MESSAGES) {
        debugLog('Reducer:addMessage', `Message limit (${MAX_MESSAGES}) reached, removing oldest message:`, state.messages[0]);
        state.messages.shift();
      }

      state.messages.push(action.payload);
      debugLog('Reducer:addMessage', 'Message added successfully. New message count:', state.messages.length);
    },
    clearMessages: (state) => {
      debugLog('Reducer:clearMessages', `Clearing ${state.messages.length} messages`);
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      debugLog('Reducer:setError', 'Setting error:', action.payload);
      state.error = action.payload;
    },
    clearError: (state) => {
      debugLog('Reducer:clearError', 'Clearing error state');
      state.error = null;
    },
  },
});

const wait = async (ms: number) => {
  debugLog('Utility:wait', `Waiting for ${ms}ms`);
  await new Promise((resolve) => setTimeout(resolve, ms));
  debugLog('Utility:wait', `Wait completed after ${ms}ms`);
};

const timeoutPromise = (ms: number) => {
  debugLog('Utility:timeout', `Setting timeout for ${ms}ms`);
  return new Promise<Response>((_, reject) =>
    setTimeout(() => {
      debugLog('Utility:timeout', `Timeout triggered after ${ms}ms`);
      reject(new Error('Timeout occurred'));
    }, ms)
  );
};

export const parseIncomingMessage = (jsonString: string) => {
  debugLog('Parser', 'Parsing incoming message:', jsonString);

  try {
    if (jsonString === '[DONE]') {
      debugLog('Parser', 'Received stream termination signal');
      return null;
    }

    const sanitizedString = he.decode(jsonString);
    debugLog('Parser', 'Sanitized string:', sanitizedString);

    const parsedData = JSON.parse(sanitizedString);
    debugLog('Parser', 'Successfully parsed JSON:', parsedData);

    if (!parsedData.persona || !parsedData.message) {
      debugLog('Parser', 'Invalid message format - missing required fields:', {
        hasPersona: !!parsedData.persona,
        hasMessage: !!parsedData.message
      });
      return null;
    }

    return parsedData;
  } catch (error) {
    debugLog('Parser', 'Error parsing message:', error);
    return null;
  }
};

const simultaneousProcessing = async (
  dispatch: AppDispatch,
  getState: () => RootState,
  input: string | Partial<Message>,
  clientId: string
) => {
  debugLog('LocalQnA', 'Starting simultaneous processing with input:', { input, clientId });
  const context = getState().chat.messages.map((msg) => msg.content).join('\n');
  debugLog('LocalQnA', 'Generated context from messages:', { contextLength: context.length });

  try {
    debugLog('LocalQnA', 'Processing local QnA');
    const localMessages = await processLocalQnA(input.toString(), context);
    debugLog('LocalQnA', 'Local QnA processing complete:', { messageCount: localMessages.length });
    
    localMessages.forEach((msg) => {
      debugLog('LocalQnA', 'Dispatching local message:', msg);
      dispatch(addMessage(msg));
    });
  } catch (error) {
    debugLog('LocalQnA', 'Error in local QnA processing:', error);
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
    debugLog('API', 'Starting debounced API call:', { input, clientId });

    const state = getState();
    if (state.api?.isLoading) {
      debugLog('API', 'Aborting - API is already loading');
      return;
    }

    dispatch(setLoading(true));
    dispatch(clearApiError());

    const messagesArray = [
      { role: 'user', content: typeof input === 'string' ? input : input.text },
    ];
    debugLog('API', 'Prepared messages array:', messagesArray);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      debugLog('API', `Starting API call attempt ${retryCount + 1}/${maxRetries}`);

      try {
        debugLog('API', 'Initiating fetch request');
        const response = await Promise.race([
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
            body: JSON.stringify({ messages: messagesArray }),
          }),
          timeoutPromise(3600000)
        ]);

        debugLog('API', 'Received response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
            debugLog('API', `Rate limited, will retry after ${retryAfter}s`);
            await wait(retryAfter * 1000);
            retryCount++;
            continue;
          }
          throw new ApiError(response.status, response.statusText);
        }

        const reader = response.body?.getReader();
        if (reader) {
          debugLog('API', 'Starting stream reading');
          const decoder = new TextDecoder();
          let textBuffer = '';

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                debugLog('API', 'Stream reading complete');
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              debugLog('API', 'Received chunk:', { chunkLength: chunk.length });
              textBuffer += chunk;

              const messages = textBuffer.split('\n\n');
              textBuffer = messages.pop() || '';
              debugLog('API', 'Processing messages from buffer:', { messageCount: messages.length });

              for (const message of messages) {
                if (message.startsWith('data: ')) {
                  const data = message.substring(6).trim();
                  debugLog('API', 'Processing message data:', data);
                  
                  const parsedData = parseIncomingMessage(data);
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
                    debugLog('API', 'Created bot message:', botMessage);
                    dispatch(addMessage(botMessage));
                  }
                }
              }
            }
          } finally {
            debugLog('API', 'Releasing reader lock');
            reader.releaseLock();
          }
        }

        dispatch(setLoading(false));
        debugLog('API', 'API call completed successfully');
        return;
      } catch (error: any) {
        debugLog('API', 'Error in API call:', error);

        if (error instanceof ApiError && error.status === 429) {
          retryCount++;
          const waitTime = Math.pow(2, retryCount) * 1000;
          debugLog('API', `Rate limit retry ${retryCount}, waiting ${waitTime}ms`);
          await wait(waitTime);
          continue;
        }

        debugLog('API', 'Setting error state and ending API call');
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
    debugLog('SendMessage', 'Starting message send process:', input);

    dispatch(clearError());

    const clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);
    debugLog('SendMessage', 'Using client ID:', clientId);

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

    debugLog('SendMessage', 'Created user message:', userMessage);
    dispatch(addMessage(userMessage));

    try {
      debugLog('SendMessage', 'Starting parallel processing');
      await simultaneousProcessing(dispatch, getState, input, clientId);
      await debouncedApiCall(dispatch, getState, input, clientId);
      debugLog('SendMessage', 'Message processing completed successfully');
    } catch (error) {
      debugLog('SendMessage', 'Error in message processing:', error);
      dispatch(setApiError('Failed to send message.'));
    }
  };

export const { addMessage, clearMessages, setError, clearError } = chatSlice.actions;
export default chatSlice.reducer;
