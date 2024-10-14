// File: components/ReduxProvider.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store } from '../store/store';
import { persistStore, Persistor } from 'redux-persist';

const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistor, setPersistor] = useState<Persistor | null>(null);

  useEffect(() => {
    // This runs only on the client side
    const persistorInstance = persistStore(store);
    setPersistor(persistorInstance);
  }, []);

  if (!persistor) {
    // Render without PersistGate during SSR
    return <Provider store={store}>{children}</Provider>;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
