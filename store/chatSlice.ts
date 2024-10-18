// File: store/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from 'store/store';
import he from 'he';
import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';
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

let eventSource: EventSource | null = null; // Hold the SSE connection

// Type guard to check if the input is of type Partial<Message>
function isMessage(input: any): input is Partial<Message> {
  return typeof input === 'object' && input !== null && 'sender' in input;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      console.debug('Adding message:', action.payload);

      const isDuplicate = state.messages.some(
        (msg) =>
          msg.id === action.payload.id ||
          (msg.text === action.payload.text &&
            msg.timestamp === action.payload.timestamp)
      );

      if (isDuplicate) {
        console.debug('Duplicate message detected, skipping:', action.payload);
        return;
      }

      if (state.messages.length >= MAX_MESSAGES) {
        console.debug('Reached max messages. Removing oldest message.');
        state.messages.shift();
      }

      state.messages.push(action.payload);
      console.log('Messages in state:', [...state.messages]);
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

// Function to listen for SSE messages
const listenToSSE = (dispatch: AppDispatch, clientId: string) => {
  eventSource = new EventSource(`/api/chat/stream?clientId=${clientId}`);

  eventSource.onmessage = (event) => {
    console.debug('Received SSE message:', event.data);
    const parsedData = parseIncomingMessage(event.data);

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
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    dispatch(setApiError('SSE connection lost.'));
    eventSource?.close(); // Close the SSE connection on error
  };
};

// Close SSE connection when needed
export const closeSSEConnection = () => {
  if (eventSource) {
    eventSource.close();
    console.debug('SSE connection closed.');
  }
};

// Send message and initiate SSE connection
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
      dispatch(setLoading(true));
      listenToSSE(dispatch, clientId); // Start listening for SSE messages
    } catch (error) {
      dispatch(setApiError('Failed to establish SSE connection.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const { addMessage, clearMessages, setError, clearError } =
  chatSlice.actions;
export default chatSlice.reducer;

