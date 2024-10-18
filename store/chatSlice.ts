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
import { ApiError, createLogger, wait } from '../utils/sharedUtils';

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

export const sendMessage =
  (input: string | Partial<Message>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const messageId = uuidv4();
    logger.debug('store/chatSlice.ts - Initiating message send', {
      messageId,
      inputType: typeof input,
    });

    dispatch(chatSlice.actions.clearError());

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

    dispatch(chatSlice.actions.addMessage(userMessage));

    try {
      logger.debug('store/chatSlice.ts - Calling processLocalQnA');
      await processLocalQnA(input.toString(), '').then((messages) => {
        messages.forEach((msg) => dispatch(chatSlice.actions.addMessage(msg)));
      });
    } catch (error) {
      logger.error('store/chatSlice.ts - Message send failed', {
        messageId,
        error,
      });
      dispatch(chatSlice.actions.setError('Failed to send message.'));
    }
  };

export const { addMessage, clearMessages, setError, clearError } =
  chatSlice.actions;
export default chatSlice.reducer;
