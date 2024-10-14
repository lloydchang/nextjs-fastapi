// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web
import noopStorage from './noopStorage'; // Custom noopStorage for SSR
import chatReducer from './chatSlice'; // Chat slice
import talkReducer from './talkSlice'; // Talk slice

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: typeof window !== 'undefined' ? storage : noopStorage, // Use localStorage only in the browser
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
      serializableCheck: false, // Disable serializable check for redux-persist
    }),
});

// Remove the creation of persistor here
// We will handle persistor creation in ReduxProvider.tsx
// export const persistor = persistStore(store);

// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
