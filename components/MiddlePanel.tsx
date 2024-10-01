// components/MiddlePanel.tsx

import React, { useState } from 'react';
import TranscriptFetcher from './TranscriptFetcher';
import TranscriptActions from './TranscriptActions';

const MiddlePanel: React.FC = () => {
  const [selectedTalk, setSelectedTalk] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [fetching, setFetching] = useState(false);

  const handleFetchComplete = (text: string) => {
    setTranscriptText(text);
    setFetching(false);
  };

  const handleError = (error: string, details?: string) => {
    console.error(`Error: ${error}`, details);
    setFetching(false);
  };

  return (
    <div>
      {selectedTalk && (
        <TranscriptFetcher
          url={selectedTalk.url}
          onFetchComplete={handleFetchComplete}
          onError={handleError}
          addLog={(message) => console.log(message)}
        />
      )}

      {transcriptText && (
        <TranscriptActions
          transcriptText={transcriptText}
          selectedTalkUrl={selectedTalk?.url || ""}
          onSendToChatbot={(transcript) => console.log(`Send to chatbot: ${transcript}`)}
          addLog={(message) => console.log(message)}
        />
      )}
    </div>
  );
};

export default MiddlePanel;
