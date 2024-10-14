// File: store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import apiReducer from './apiSlice';
import notificationReducer from './notificationSlice';
import talkReducer from './talkSlice';

import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web

// Define the persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['chat', 'notification'], // Specify which reducers you want to persist
};

// Create a root reducer object
const rootReducer = {
  chat: chatReducer,
  api: apiReducer,
  notification: notificationReducer,
  talk: talkReducer,
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, combineReducers(rootReducer));

// Configure the store with the persisted reducer
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create the persistor
const persistor = persistStore(store);

// Export both store and persistor
export { store, persistor };

// Export types for usage in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
