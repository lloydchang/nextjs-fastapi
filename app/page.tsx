// app/page.tsx

// moved from
// pages/index.tsx
// to
// app/page.tsx
// because of Next.js 14

// pages/index.tsx

'use client'; // Mark as Client Component

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TalkProvider } from '../context/TalkContext'; // Import the TalkProvider
import '../styles/globals.css'; // Ensure global styles are applied
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load all panels

const LeftPanel = dynamic(() => import('../components/LeftPanel'), {
  loading: () => <p>Loading Left Panel...</p>,
  ssr: false,
});

const MiddlePanel = dynamic(() => import('../components/MiddlePanel'), {
  loading: () => <p>Loading Middle Panel...</p>,
  ssr: false,
});

const RightPanel = dynamic(() => import('../components/RightPanel'), {
  loading: () => <p>Loading Right Panel...</p>,
  ssr: false,
});

const Home: React.FC = () => {
  return (
    <TalkProvider>
      <div className="container">
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
  );
};

export default Home;
