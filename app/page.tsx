// app/page.tsx

// moved from
// pages/index.tsx
// to
// app/page.tsx
// because of Next.js 14

// pages/index.tsx

'use client'; // Mark as Client Component

import React, { Suspense } from 'react';
import LeftPanel from '../components/LeftPanel';
import dynamic from 'next/dynamic';
import { TalkProvider } from '../context/TalkContext'; // Import the TalkProvider
import '../styles/globals.css'; // Ensure global styles are applied

// Lazy load MiddlePanel and RightPanel
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
        <LeftPanel />
        <Suspense fallback={<p>Loading Middle Panel...</p>}>
          <MiddlePanel />
        </Suspense>
        <Suspense fallback={<p>Loading Right Panel...</p>}>
          <RightPanel />
        </Suspense>
      </div>
    </TalkProvider>
  );
};

export default Home;
