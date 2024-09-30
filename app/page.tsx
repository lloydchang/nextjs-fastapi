// app/page.tsx
'use client'; // Add this directive to make the component a Client Component

import React, { useEffect } from 'react';
import LeftPanel from '../components/LeftPanel';
import MiddlePanel from '../components/MiddlePanel';
import RightPanel from '../components/RightPanel';
import { TalkProvider } from '../context/TalkContext'; // Import the TalkProvider
import '../styles/globals.css'; // Make sure global styles are applied

const Home: React.FC = () => {
  console.log('Home component rendered'); // This will log every time the component re-renders

  useEffect(() => {
    console.log('Home component mounted'); // This will log once when the component mounts
  }, []);

  return (
    <TalkProvider>
      <div className="container">
        <LeftPanel />
        <MiddlePanel />
        <RightPanel />
      </div>
    </TalkProvider>
  );
};

export default Home;
