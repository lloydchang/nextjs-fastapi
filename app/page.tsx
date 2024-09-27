// app/page.tsx
import React from 'react';
import LeftPanel from '../components/LeftPanel';
import MiddlePanel from '../components/MiddlePanel';
import RightPanel from '../components/RightPanel';
import '../styles/globals.css'; // Make sure global styles are applied

const Home: React.FC = () => {
  return (
    <div className="container">
      <LeftPanel />
      <MiddlePanel />
      <RightPanel />
    </div>
  );
};

export default Home;
