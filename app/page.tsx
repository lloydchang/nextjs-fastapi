// File: app/page.tsx

'use client'; // Ensure this is a client component

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import { Provider } from 'react-redux'; // Import Provider from react-redux
import store from '../store/store'; // Adjust the import path if necessary
import Notification from '../components/atoms/Notification'; // Import the Notification component

// Dynamically import TalkPanel and ChatPanel components
const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), {
  ssr: true, // Enable Server-Side Rendering if needed
});

const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), {
  ssr: true, // Enable Server-Side Rendering if needed
});

const Home: React.FC = () => {
  return (
    // Wrap the entire application with the Redux Provider
    <Provider store={store}>
      {/* Notification component to display user feedback */}
      <Notification />
      
      <div className="container">
        {/* Suspense allows for lazy loading with a fallback UI */}
        <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
          <ErrorBoundary>
            <TalkPanel />
          </ErrorBoundary>
        </Suspense>
        
        <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
          <ErrorBoundary>
            <ChatPanel />
          </ErrorBoundary>
        </Suspense>
      </div>
    </Provider>
  );
};

export default Home;
