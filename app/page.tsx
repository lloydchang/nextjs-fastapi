// File: app/page.tsx

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import ReduxProvider from '../components/ReduxProvider'; 

// Dynamically import TalkPanel and ChatPanel with SSR enabled.
const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), { ssr: true });
const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), { ssr: true });

const Home: React.FC = () => {
  // Log lifecycle to catch unnecessary remounts.
  useEffect(() => {
    console.log('Home component mounted.');

    return () => {
      console.log('Home component unmounted.');
    };
  }, []);

  return (
    <ReduxProvider>
      <div className="container">
        {/* Avoid redundant Suspense fallback elements */}
        <ErrorBoundary>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <TalkPanel />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ height: '100vh', opacity: 0 }} />}>
            <ChatPanel />
          </Suspense>
        </ErrorBoundary>
      </div>
    </ReduxProvider>
  );
};

export default Home;
