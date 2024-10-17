// File: components/ReduxProvider.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, createPersistedStore } from '../store/store';
import type { Store } from '@reduxjs/toolkit';
import type { Persistor } from 'redux-persist';

const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistedStore, setPersistedStore] = useState<Store>(store);
  const [persistor, setPersistor] = useState<Persistor | null>(null);

  useEffect(() => {
    const initializeStore = async () => {
      const { persistedStore, persistor } = await createPersistedStore();
      setPersistedStore(persistedStore);
      setPersistor(persistor);
    };

    initializeStore();
  }, []);

  if (!persistor) {
    return <Provider store={persistedStore}>{children}</Provider>;
  }

  return (
    <Provider store={persistedStore}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
