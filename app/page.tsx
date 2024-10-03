// app/page.tsx

// moved from
// pages/index.tsx
// to
// app/page.tsx
// because of Next.js 14

// app/page.tsx

'use client'; // Mark as Client Component

// console.log("Loaded environment variables:", process.env);

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TalkProvider } from '../context/TalkContext';
import { ChatProvider } from '../context/ChatContext'; // Import ChatProvider
import './globals.css'; // Global CSS styles
import ErrorBoundary from '../components/ErrorBoundary';

// Dynamically load all panels
const LeftPanel = dynamic(() => import('../components/LeftPanel'), {
  loading: () => <p>Loading Left Panel...</p>,
  ssr: true,
});

const MiddlePanel = dynamic(() => import('../components/MiddlePanel'), {
  loading: () => <p>Loading Middle Panel...</p>,
  ssr: true,
});

const RightPanel = dynamic(() => import('../components/RightPanel'), {
  loading: () => <p>Loading Right Panel...</p>,
  ssr: true,
});

const Home: React.FC = () => {
  return (
    <ChatProvider isMemOn={true}>
      <TalkProvider>
        <div className="container">
          {/* Use Suspense and ErrorBoundary for each panel */}
          <Suspense fallback={<p>Loading Left Panel...</p>}>
            <ErrorBoundary>
              <LeftPanel />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<p>Loading Middle Panel...</p>}>
            <ErrorBoundary>
              <MiddlePanel />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<p>Loading Right Panel...</p>}>
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
