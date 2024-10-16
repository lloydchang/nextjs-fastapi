// File: pages/speech-test.tsx

import React from 'react';
import SpeechTest from 'components/atoms/SpeechTest'; // Import SpeechTest component
import useMedia from 'components/state/hooks/useMedia'; // Use useMedia for mic control

const SpeechTestPage: React.FC = () => {
  const { mediaState, toggleMic } = useMedia(); // Use media hook to manage mic

  const handleSpeechResult = (finalResult: string) => {
    console.log('Final speech result:', finalResult);
  };

  const handleInterimUpdate = (interimResult: string) => {
    console.log('Interim speech update:', interimResult);
  };

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh' }}> {/* Black background */}
      <SpeechTest 
        isMicOn={mediaState.isMicOn} // Use mediaState to track mic state
        toggleMic={toggleMic} // Pass toggleMic to control mic
        onSpeechResult={handleSpeechResult} 
        onInterimUpdate={handleInterimUpdate} 
        showFinalResult={true} // Show final result in speech-test page
      />
      <button onClick={toggleMic}>
        {mediaState.isMicOn ? 'Turn Mic Off' : 'Turn Mic On'}
      </button>
    </div>
  );
};

export default SpeechTestPage;
