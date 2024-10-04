// app/page.tsx

'use client'; // Mark as Client Component

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TalkProvider } from '../context/TalkContext';
import { ChatProvider } from '../context/ChatContext'; // Import ChatProvider
import './globals.css'; // Global CSS styles
import ErrorBoundary from '../components/ErrorBoundary';

// Dynamically load all panels without displaying loading text
const LeftPanel = dynamic(() => import('../components/LeftPanel'), {
  loading: () => <div style={{ height: '100vh', opacity: 0 }} />, // Invisible placeholder to prevent transitions
  ssr: true,
});

const MiddlePanel = dynamic(() => import('../components/MiddlePanel'), {
  loading: () => <div style={{ height: '100vh', opacity: 0 }} />, // Invisible placeholder
  ssr: true,
});

const RightPanel = dynamic(() => import('../components/RightPanel'), {
  loading: () => <div style={{ height: '100vh', opacity: 0 }} />, // Invisible placeholder
  ssr: true,
});

const Home: React.FC = () => {
  return (
    <ChatProvider isMemOn={true}>
      <TalkProvider>
        <div className="container">
          {/* Use Suspense and ErrorBoundary for each panel */}
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ErrorBoundary>
              <LeftPanel />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ErrorBoundary>
              <MiddlePanel />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ErrorBoundary>
              <RightPanel />
            </ErrorBoundary>
          </Suspense>
        </div>
      </TalkProvider>
    </ChatProvider>
  );
};

export default Home;
