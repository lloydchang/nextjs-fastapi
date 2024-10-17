// File: app/page.tsx

'use client'; // This directive makes the component a Client Component.

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import ReduxProvider from '../components/ReduxProvider'; 

const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), { ssr: true });
const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), { ssr: true });

const Home: React.FC = () => {
  useEffect(() => {
    console.log('Home component mounted.');

    return () => {
      console.log('Home component unmounted.');
    };
  }, []);

  return (
    <ReduxProvider>
      <div className="container">
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
