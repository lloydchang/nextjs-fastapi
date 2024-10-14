// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import talkReducer from './talkSlice';
import apiReducer from './apiSlice';

// Create the Redux store without persistence for SSR
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    talk: talkReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export a function to create the persisted store
export const createPersistedStore = async () => {
  if (typeof window !== 'undefined') {
    const { persistStore, persistReducer } = await import('redux-persist');
    const storage = await import('redux-persist/lib/storage');

    const persistConfig = {
      key: 'root',
      storage: storage.default,
    };

    const persistedChatReducer = persistReducer(persistConfig, chatReducer);
    const persistedTalkReducer = persistReducer(persistConfig, talkReducer);

    const persistedStore = configureStore({
      reducer: {
        chat: persistedChatReducer,
        talk: persistedTalkReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    const persistor = persistStore(persistedStore);

    return { persistedStore, persistor };
  }

  return { persistedStore: store, persistor: null };
};
