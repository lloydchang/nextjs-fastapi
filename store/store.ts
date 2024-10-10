// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import chatReducer from './chatSlice'; // Chat slice
import talkReducer from './talkSlice'; // Talk slice

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
};

// Create persisted reducers
const persistedChatReducer = persistReducer(persistConfig, chatReducer);
const persistedTalkReducer = persistReducer(persistConfig, talkReducer);

// Create the Redux store with the persisted reducers
export const store = configureStore({
  reducer: {
    chat: persistedChatReducer,
    talk: persistedTalkReducer, // Ensure the talk slice is included
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Create the persisted store
export const persistor = persistStore(store);

// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
