// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect } from 'react';

const Panel: React.FC = () => {
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImage(false);
    }, 1000); // Wait for 1 second (1000 milliseconds)

    return () => clearTimeout(timer); // Clear timeout on component unmount
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Ideas Change Everything!</h1>
      {showImage ? (
        <img 
          src="TEDxSDG.jpg" 
          alt="TEDxSDG"
          style={{ height: '100vh', width: 'auto', marginTop: '10px', maxWidth: '100%' }} 
        />
      ) : (
        <iframe
          src="http://localhost:8501/" 
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      )}
    </div>
  );
};

export default Panel;
