// File: app/page.tsx

'use client'; // Ensure this is a client component

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import ReduxProvider from '../components/ReduxProvider'; // Import the ReduxProvider

const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), {
  ssr: true, // Enable Server-Side Rendering if needed
});

const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), {
  ssr: true, // Enable Server-Side Rendering if needed
});

const Home: React.FC = () => {
  return (
    <ReduxProvider>
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
    </ReduxProvider>
  );
};

export default Home;
