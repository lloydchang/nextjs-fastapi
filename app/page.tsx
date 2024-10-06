// app/page.tsx

'use client'; // Mark as Client Component

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TalkProvider } from '../components/state/context/TalkContext';
import { ChatProvider } from '../components/state/context/ChatContext'; // Import ChatProvider
import './globals.css'; // Global CSS styles
import ErrorBoundary from '../components/organisms/ErrorBoundary';

// Dynamically load all panels without displaying loading text
const LeftPanel = dynamic(() => import('../components/organisms/LeftPanel'), {
  loading: () => <div style={{ height: '100vh', opacity: 0 }} />, // Invisible placeholder to prevent transitions
  ssr: true,
});

const MiddlePanel = dynamic(() => import('../components/organisms/MiddlePanel'), {
  loading: () => <div style={{ height: '100vh', opacity: 0 }} />, // Invisible placeholder
  ssr: true,
});

const RightPanel = dynamic(() => import('../components/organisms/RightPanel'), {
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
              <div className="left-panel">
                <LeftPanel />
              </div>
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ErrorBoundary>
              <div className="middle-panel">
                <MiddlePanel />
              </div>
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ErrorBoundary>
              <div className="right-panel">
                <RightPanel />
              </div>
            </ErrorBoundary>
          </Suspense>
        </div>
      </TalkProvider>
    </ChatProvider>
  );
};

export default Home;
