// components/TranscriptActions.tsx

import React from "react";

interface TranscriptActionsProps {
  transcriptText: string;
  selectedTalkUrl: string;
  onSendToChatbot: (transcript: string) => void;
  addLog: (message: string) => void;
}

const TranscriptActions: React.FC<TranscriptActionsProps> = ({
  transcriptText,
  selectedTalkUrl,
  onSendToChatbot,
  addLog,
}) => {
  const handleSendToChatbot = () => {
    addLog('Sending transcript to chatbot...');
    onSendToChatbot(transcriptText);
  };

  const openTranscriptInNewTab = () => {
    const transcriptUrl = `${selectedTalkUrl}/transcript?subtitle=en`;
    window.open(transcriptUrl, '_blank');
    addLog(`Opened transcript in a new tab: ${transcriptUrl}`);
  };

  return (
    <div>
      <button onClick={handleSendToChatbot}>Send to Chatbot</button>
      <button onClick={openTranscriptInNewTab}>View Transcript in New Tab</button>
    </div>
  );
};

export default TranscriptActions;
