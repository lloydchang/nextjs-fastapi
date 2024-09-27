// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React from 'react';

const Panel: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1>TEDAI San Francisco Hackathon</h1>
      <iframe 
        src="https://tedai-sanfrancisco.ted.com/hackathon/" 
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default Panel;
