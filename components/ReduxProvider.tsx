// File: components/ReduxProvider.tsx

'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from 'store/store'; // Use named imports
import Notification from './atoms/Notification'; // Adjust the path as necessary

const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* Notification component is now inside the Provider and PersistGate */}
        <Notification />
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
