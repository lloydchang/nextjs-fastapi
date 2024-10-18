// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash/debounce';
import { setLoading, setApiError, clearApiError } from './apiSlice';
import { processLocalQnA } from '../utils/tensorflowQnA';
import { getBrowserName } from '../utils/browserDetection';

// Debug logger configuration
const createLogger = (namespace: string) => ({
  debug: (...args: any[]) => console.debug(`[${namespace}]`, ...args),
  error: (...args: any[]) => console.error(`[${namespace}]`, ...args),
  info: (...args: any[]) => console.info(`[${namespace}]`, ...args),
  warn: (...args: any[]) => console.warn(`[${namespace}]`, ...args),
});

const logger = createLogger('ChatSlice');

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
    logger.debug('store/chatSlice.ts - ApiError created', { status, message });
  }
}

function isMessage(input: any): input is Partial<Message> {
  const result = typeof input === 'object' && input !== null && 'sender' in input;
  logger.debug('store/chatSlice.ts - Message type check', { input, isValid: result });
  return result;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const messageId = action.payload.id || '[no-id]';
      logger.debug('store/chatSlice.ts - Adding message', {
        id: messageId,
        sender: action.payload.sender,
        timestamp: action.payload.timestamp,
        contentLength: action.payload.text?.length,
      });

      // Check for duplicates
      const isDuplicate = state.messages.some(
        (msg) =>
          msg.text === action.payload.text &&
          msg.timestamp === action.payload.timestamp
      );

      if (isDuplicate) {
        logger.warn('store/chatSlice.ts - Duplicate message detected', {
          id: messageId,
          text: action.payload.text?.slice(0, 50) + '...',
          timestamp: action.payload.timestamp,
        });
        return;
      }

      // Handle message limit
      if (state.messages.length >= MAX_MESSAGES) {
        logger.info('store/chatSlice.ts - Message limit reached', {
          maxMessages: MAX_MESSAGES,
          removingMessage: state.messages[0],
        });
        state.messages.shift();
      }

      state.messages.push(action.payload);
      logger.debug('store/chatSlice.ts - Message added successfully', {
        totalMessages: state.messages.length,
        lastMessageId: messageId,
      });
    },
    clearMessages: (state) => {
      logger.debug('store/chatSlice.ts - Clearing messages', {
        messageCount: state.messages.length,
      });
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string>) => {
      logger.warn('store/chatSlice.ts - Setting error state', { error: action.payload });
      state.error = action.payload;
    },
    clearError: (state) => {
      logger.debug('store/chatSlice.ts - Clearing error state', { previousError: state.error });
      state.error = null;
    },
  },
});

const wait = (ms: number) => {
  logger.debug('store/chatSlice.ts - Waiting', { milliseconds: ms });
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const timeoutPromise = (ms: number) => {
  logger.debug('store/chatSlice.ts - Setting timeout promise', { milliseconds: ms });
  return new Promise<Response>((_, reject) =>
    setTimeout(() => {
      logger.warn('store/chatSlice.ts - Request timeout reached', { milliseconds: ms });
      reject(new Error('Timeout'));
    }, ms)
  );
};

export const parseIncomingMessage = (jsonString: string) => {
  logger.debug('store/chatSlice.ts - Parsing incoming message', {
    messageLength: jsonString.length,
    preview: jsonString.slice(0, 100) + '...',
  });

  try {
    if (jsonString === '[DONE]') {
      logger.debug('store/chatSlice.ts - Received DONE signal');
      return null;
    }

    const sanitizedString = he.decode(jsonString);
    const parsedData = JSON.parse(sanitizedString);

    if (!parsedData.persona || !parsedData.message) {
      logger.warn('store/chatSlice.ts - Invalid message format', { parsedData });
      return null;
    }

    logger.debug('store/chatSlice.ts - Message parsed successfully', {
      persona: parsedData.persona,
      messageLength: parsedData.message.length,
    });
    return parsedData;
  } catch (error) {
    logger.error('store/chatSlice.ts - Message parsing failed', {
      error,
      jsonString,
    });
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
    const requestId = uuidv4();
    logger.debug('store/chatSlice.ts - Starting debounced API call', {
      requestId,
      clientId,
      inputType: typeof input,
    });

    const state = getState();
    if (state.api?.isLoading) {
      logger.debug('store/chatSlice.ts - Skipping API call - already loading', { requestId });
      return;
    }

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

    logger.debug('store/chatSlice.ts - Prepared request payload', {
      requestId,
      messageCount: messagesArray.length,
      contentLength: userMessageContent.length,
    });

    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount < maxRetries) {
      try {
        logger.debug('store/chatSlice.ts - Processing TensorFlow prediction', {
          requestId,
          attempt: retryCount + 1,
        });

        const tfPredictionMessages = await processLocalQnA(input.toString(), '');
        logger.debug('store/chatSlice.ts - TensorFlow prediction completed', {
          requestId,
          resultCount: tfPredictionMessages.length,
        });

        const tfPredictionText =
          tfPredictionMessages.length > 0
            ? tfPredictionMessages[0].text
            : 'No answer found';

        const browserName = getBrowserName();
        
        const botMessageFromTF: Message = {
          id: uuidv4(),
          sender: 'bot',
          text: tfPredictionText,
          role: 'bot',
          content: tfPredictionText,
          persona: `${browserName} TensorFlow-QnA`,
          timestamp: Date.now(),
        };
        
        logger.debug('store/chatSlice.ts - Dispatching TF prediction message', {
          requestId,
          messageId: botMessageFromTF.id,
          contentLength: tfPredictionText.length,
          browser: browserName,
        });
        
        dispatch(addMessage(botMessageFromTF));

        logger.debug('store/chatSlice.ts - Starting parallel API and TF processing', { requestId });

        const [tfResult, apiResult] = await Promise.allSettled([
          processLocalQnA(input.toString(), ''),
          (async () => {
            logger.debug('store/chatSlice.ts - Initiating API request', {
              requestId,
              clientId,
              endpoint: '/api/chat',
            });

            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-client-id': clientId,
              },
              body: JSON.stringify({ messages: messagesArray }),
            });

            logger.debug('store/chatSlice.ts - API response received', {
              requestId,
              status: response.status,
              headers: Object.fromEntries(response.headers),
            });

            const responseBody = await response.text();

            if (!response.ok) {
              if (response.status === 429) {
                const retryAfter = parseInt(
                  response.headers.get('Retry-After') || '1',
                  10
                );
                logger.warn('store/chatSlice.ts - Rate limit encountered', {
                  requestId,
                  retryAfter,
                  attempt: retryCount + 1,
                });
                await wait(retryAfter * 1000);
                throw new ApiError(response.status, 'Retrying...');
              }
              throw new ApiError(response.status, responseBody);
            }

            return JSON.parse(responseBody);
          })(),
          timeoutPromise(3600000) // Timeout set to 1 hour which is 3600000 milliseconds
        ]);

        logger.debug('store/chatSlice.ts - Parallel processing completed', {
          requestId,
          tfStatus: tfResult.status,
          apiStatus: apiResult.status,
        });

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

          logger.debug('store/chatSlice.ts - Processing TF messages', {
            requestId,
            messageCount: tfMessages.length,
          });

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

          logger.debug('store/chatSlice.ts - Processing API message', {
            requestId,
            messageId: apiMessage.id,
            contentLength: apiMessage.text.length,
          });

          dispatch(addMessage(apiMessage));
        }

        logger.debug('store/chatSlice.ts - Request completed successfully', { requestId });
        dispatch(setLoading(false));
        return;

      } catch (error: any) {
        logger.error('store/chatSlice.ts - Request error', {
          requestId,
          attempt: retryCount + 1,
          error: error.message,
          status: error instanceof ApiError ? error.status : undefined,
          stack: error.stack,
        });

        if (error instanceof ApiError && error.status === 429) {
          retryCount++;
          const retryDelay = Math.pow(2, retryCount) * 1000;
          logger.info('store/chatSlice.ts - Scheduling retry', {
            requestId,
            attempt: retryCount,
            delay: retryDelay,
          });
          await wait(retryDelay);
          continue;
        }

        dispatch(setApiError(error.message || 'An unknown error occurred'));
        dispatch(setLoading(false));
        return;
      }
    }

    logger.error('store/chatSlice.ts - Max retries exceeded', {
      requestId,
      maxRetries,
      totalAttempts: retryCount,
    });
    dispatch(setApiError('Failed to get a response after multiple attempts.'));
    dispatch(setLoading(false));
  },
  1000
);

export const sendMessage =
  (input: string | Partial<Message>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const messageId = uuidv4();
    logger.debug('store/chatSlice.ts - Initiating message send', {
      messageId,
      inputType: typeof input,
    });

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

    logger.debug('store/chatSlice.ts - Created user message', {
      messageId: userMessage.id,
      sender: userMessage.sender,
      contentLength: userMessage.text.length,
    });

    dispatch(addMessage(userMessage));

    try {
      logger.debug('store/chatSlice.ts - Calling debounced API', {
        messageId,
        clientId,
      });
      await debouncedApiCall(dispatch, getState, input, clientId);
    } catch (error) {
      logger.error('store/chatSlice.ts - Message send failed', {
        messageId,
        error,
      });
      dispatch(setApiError('Failed to send message.'));
    }
  };

export const { addMessage, clearMessages, setError, clearError } =
  chatSlice.actions;
export default chatSlice.reducer;
