// File: components/ReduxProvider.tsx

'use client';

import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, createPersistedStore } from '../store/store';
import { useState, useEffect } from 'react';

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  const [persistedStore, setPersistedStore] = useState(store);
  const [persistor, setPersistor] = useState<any>(null);

  useEffect(() => {
    const initializeStore = async () => {
      const { persistedStore, persistor } = await createPersistedStore();
      setPersistedStore(persistedStore);
      setPersistor(persistor);
    };
    initializeStore();
  }, []);

  if (!persistor) return <div></div>; // Prevent remounting by waiting

  return (
    <Provider store={persistedStore}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
