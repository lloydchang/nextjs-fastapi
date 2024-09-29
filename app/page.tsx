// app/page.tsx
import React from 'react';
import LeftPanel from '../components/LeftPanel';
import MiddlePanel from '../components/MiddlePanel';
import RightPanel from '../components/RightPanel';
import { TalkProvider } from '../context/TalkContext'; // Import the TalkProvider
import '../styles/globals.css'; // Make sure global styles are applied

const Home: React.FC = () => {
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
