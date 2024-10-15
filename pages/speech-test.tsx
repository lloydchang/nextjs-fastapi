// File: pages/speech-test.tsx

import React from 'react';
import SpeechTest from 'components/atoms/SpeechTest'; // Import SpeechTest component

const SpeechTestPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh' }}> {/* Black background */}
      <SpeechTest /> {/* Render the SpeechTest component */}
    </div>
  );
};

export default SpeechTestPage;
