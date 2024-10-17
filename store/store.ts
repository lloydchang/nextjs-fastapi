// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import talkReducer from './talkSlice';
import apiReducer from './apiSlice'; // Import apiReducer
import noopStorage from './noopStorage'; // Import noopStorage

// Configure the Redux store with reducers and middleware
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    talk: talkReducer,
    api: apiReducer, // Include apiReducer in the store
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false, thunk: true }), // Ensure thunk middleware is included
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const createPersistedStore = async () => {
  const { persistStore, persistReducer } = await import('redux-persist');

  // Dynamically select storage (noopStorage for SSR, localStorage for browser)
  const storage = typeof window !== 'undefined'
    ? await import('redux-persist/lib/storage').then((mod) => mod.default)
    : noopStorage;

  const persistConfig = { key: 'root', storage };

  // Wrap each reducer with persistence
  const persistedChatReducer = persistReducer(persistConfig, chatReducer);
  const persistedTalkReducer = persistReducer(persistConfig, talkReducer);
  const persistedApiReducer = persistReducer(persistConfig, apiReducer); // Persist API reducer

  // Configure store with persisted reducers and middleware
  const persistedStore = configureStore({
    reducer: {
      chat: persistedChatReducer,
      talk: persistedTalkReducer,
      api: persistedApiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, thunk: true }), // Ensure thunk middleware is active
  });

  // Create persistor for store persistence
  const persistor = persistStore(persistedStore);
  return { persistedStore, persistor };
};
