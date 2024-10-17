// File: app/page.tsx

'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import './globals.css'; 
import ErrorBoundary from '../components/organisms/ErrorBoundary';
import ReduxProvider from '../components/ReduxProvider';
import { ModalProvider } from '../components/state/context/ModalContext'; // Import ModalProvider

const TalkPanel = dynamic(() => import('../components/organisms/TalkPanel'), { ssr: false });
const ChatPanel = dynamic(() => import('../components/organisms/ChatPanel'), { ssr: false });

const Home: React.FC = () => {
  return (
    <ReduxProvider>
      <ModalProvider> {/* Wrap the component tree with ModalProvider */}
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
      </ModalProvider>
    </ReduxProvider>
  );
};

export default Home;
