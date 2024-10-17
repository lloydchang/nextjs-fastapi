// File: app/page.tsx

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import ReduxProvider from '../components/ReduxProvider'; 

const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), { ssr: true });
const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), { ssr: true });

const Home: React.FC = () => {
  return (
    <ReduxProvider>
      <div className="container">
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
