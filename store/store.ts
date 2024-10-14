// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web
import noopStorage from './noopStorage'; // Custom noopStorage for SSR
import chatReducer from './chatSlice'; // Chat slice
import talkReducer from './talkSlice'; // Talk slice

// Utility function to check for localStorage availability
const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: isStorageAvailable() ? storage : noopStorage,  // Use localStorage if available, else noopStorage
};

// Create persisted reducers
const persistedChatReducer = persistReducer(persistConfig, chatReducer);
const persistedTalkReducer = persistReducer(persistConfig, talkReducer);

// Create the Redux store with the persisted reducers
export const store = configureStore({
  reducer: {
    chat: persistedChatReducer,
    talk: persistedTalkReducer,  // Ensure the talk slice is included
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,  // Disable serializable check for redux-persist
    }),
});

// Create the persisted store
export const persistor = persistStore(store);

// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
