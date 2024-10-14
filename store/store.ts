// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import apiReducer from './apiSlice';
// Import other reducers as needed, e.g., talkReducer

const store = configureStore({
  reducer: {
    chat: chatReducer,
    api: apiReducer,
    // Add other reducers here, e.g., talk: talkReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Adjust if needed
    }),
});

// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
