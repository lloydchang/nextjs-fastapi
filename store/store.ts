// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import talkReducer from './talkSlice';
import apiReducer from './apiSlice'; // Import apiReducer

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    talk: talkReducer,
    api: apiReducer, // Include api reducer in the main store
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const createPersistedStore = async () => {
  const { persistStore, persistReducer } = await import('redux-persist');
  const storage = await import('redux-persist/lib/storage');

  const persistConfig = { key: 'root', storage: storage.default };

  // Wrap reducers with persistence support
  const persistedChatReducer = persistReducer(persistConfig, chatReducer);
  const persistedTalkReducer = persistReducer(persistConfig, talkReducer);
  const persistedApiReducer = persistReducer(persistConfig, apiReducer); // Persist API reducer

  const persistedStore = configureStore({
    reducer: {
      chat: persistedChatReducer,
      talk: persistedTalkReducer,
      api: persistedApiReducer, // Add the persisted API reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

  const persistor = persistStore(persistedStore);
  return { persistedStore, persistor };
};
