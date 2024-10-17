// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import talkReducer from './talkSlice';
import apiReducer from './apiSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    talk: talkReducer,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
