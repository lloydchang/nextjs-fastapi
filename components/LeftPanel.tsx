// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React from 'react';

const Panel: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Ideas Change Everything!</h1>
      <img 
        src="TEDxSDG.jpg" 
        alt="TEDxSDG"
        style={{ height: '100vh', width: 'auto', marginTop: '10px', maxWidth: '100%' }} 
      />
    </div>
  );
};

export default Panel;
