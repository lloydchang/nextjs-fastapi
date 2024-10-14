// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import apiReducer from './apiSlice';
import notificationReducer from './notificationSlice';
import talkReducer from './talkSlice';

const store = configureStore({
  reducer: {
    chat: chatReducer,
    api: apiReducer,
    notification: notificationReducer,
    talk: talkReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Adjust if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
