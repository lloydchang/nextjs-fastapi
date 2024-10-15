// File: pages/speech-test.tsx

import React, { useState } from 'react';
import SpeechTest from 'components/atoms/SpeechTest'; // Import SpeechTest component

const SpeechTestPage: React.FC = () => {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);

  const handleSpeechResult = (finalResult: string) => {
    console.log('Final speech result:', finalResult);
  };

  const handleInterimUpdate = (interimResult: string) => {
    console.log('Interim speech update:', interimResult);
  };

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh' }}> {/* Black background */}
      <SpeechTest 
        isMicOn={isMicOn} 
        onSpeechResult={handleSpeechResult} 
        onInterimUpdate={handleInterimUpdate} 
      />
      <button onClick={() => setIsMicOn(!isMicOn)}>
        {isMicOn ? 'Turn Mic Off' : 'Turn Mic On'}
      </button>
    </div>
  );
};

export default SpeechTestPage;
