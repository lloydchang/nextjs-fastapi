// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect } from 'react';

const Panel: React.FC = () => {
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImage(false);
      console.log("Switched to iframe");
    }, 1000); // Wait for 1 second

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Ideas Change Everything!</h1>
      {showImage ? (
        <img 
          src="TEDxSDG.jpg" 
          alt="TEDxSDG"
          style={{ height: '100vh', width: 'auto', marginTop: '10px', maxWidth: '100%' }} 
          onLoad={() => console.log("Image loaded successfully")}
          onError={() => console.error("Failed to load the image")}
        />
      ) : (
        <iframe
          src="http://localhost:8501/" 
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={() => console.log("Iframe loaded successfully")}
        />
      )}
    </div>
  );
};

export default Panel;
