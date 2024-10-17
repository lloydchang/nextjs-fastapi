// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import talkReducer from './talkSlice';
import apiReducer from './apiSlice';
import noopStorage from './noopStorage'; 

// Configure the Redux store
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    talk: talkReducer,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) => {
    // console.debug('[Store] Configuring middleware');
    return getDefaultMiddleware({ serializableCheck: false, thunk: true });
  },
});

// Define types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create a persisted store
export const createPersistedStore = async () => {
  // console.debug('[Store] Creating persisted store');

  const { persistStore, persistReducer } = await import('redux-persist');

  const storage =
    typeof window !== 'undefined'
      ? await import('redux-persist/lib/storage').then((mod) => {
          // console.debug('[Store] Using local storage for persistence');
          return mod.default;
        })
      : noopStorage;

  const persistConfig = { key: 'root', storage };

  const persistedChatReducer = persistReducer(persistConfig, chatReducer);
  const persistedTalkReducer = persistReducer(persistConfig, talkReducer);
  const persistedApiReducer = persistReducer(persistConfig, apiReducer);

  const persistedStore = configureStore({
    reducer: {
      chat: persistedChatReducer,
      talk: persistedTalkReducer,
      api: persistedApiReducer,
    },
    middleware: (getDefaultMiddleware) => {
      // console.debug('[Store] Configuring middleware for persisted store');
      return getDefaultMiddleware({ serializableCheck: false, thunk: true });
    },
  });

  const persistor = persistStore(persistedStore);
  // console.debug('[Store] Persisted store created successfully');

  return { persistedStore, persistor };
};
