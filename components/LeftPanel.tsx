// components/LeftPanel.tsx

'use client'; // Ensure this directive is present

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import BackgroundImage from '../public/TEDxSDG.jpg';
import { useChat } from '../hooks/useChat';
import dynamic from 'next/dynamic';
import VideoStream from './VideoStream';
import AudioStream from './AudioStream';
import ChatInput from './ChatInput';
import ControlButtons from './ControlButtons';
import styles from '../styles/LeftPanel.module.css';
import { useMedia } from '../hooks/useMedia';
import TestSpeechRecognition from './TestSpeechRecognition'; // Assuming this is the component for testing

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <p>Loading messages...</p>,
  ssr: false,
});

const LeftPanel: React.FC = () => {
  // Use Media State
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();

  // Use Chat State with isMemOn based on mediaState
  const { messages, setMessages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  // Initialize chat input state
  const [chatInput, setChatInput] = useState<string>(''); // Ensure this is outside any conditionals
  const [error, setError] = useState<string | null>(null);

  // Handle sending chat messages
  const handleChat = useCallback(
    async (input: string) => {
      if (input.trim()) {
        try {
          console.log('Sending message to chatbot:', input);
          await sendActionToChatbot(input);
          setChatInput(''); // Clear the chat input after sending
        } catch (error) {
          console.error('Error sending message:', error);
          setError('Failed to send message.');
        }
      }
    },
    [sendActionToChatbot]
  );

  // Handle speech recognition results
  const handleSpeechResults = useCallback(
    (results: string) => {
      console.log('Received speech results:', results);
      handleChat(results); // Send speech results to chatbot handler
    },
    [handleChat]
  );

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}

      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      <div className={mediaState.isPipOn ? styles.videoStreamHidden : styles.videoStream}>
        <VideoStream isCamOn={mediaState.isCamOn} videoRef={videoRef} />
      </div>
      <AudioStream isMicOn={mediaState.isMicOn} audioRef={audioRef} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <b>Ideas Change Everything!</b>
        </h1>
        <div className={styles.chatInterface}>
          <h3 className={styles.chatHeader}>
            <b>Chat with TEDxSDG</b>
          </h3>

          <HeavyChatMessages messages={messages} />
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={() => handleChat(chatInput)} />

          <ControlButtons
            isCamOn={mediaState.isCamOn}
            isMicOn={mediaState.isMicOn}
            toggleMic={toggleMic}
            startCam={startCam}
            stopCam={stopCam}
            isPipOn={mediaState.isPipOn}
            togglePip={togglePip}
            isMemOn={mediaState.isMemOn}
            toggleMem={toggleMem}
            eraseMemory={clearChatHistory} // Pass eraseMemory function
          />

          {/* Test Speech Recognition Component */}
          <TestSpeechRecognition isMicOn={mediaState.isMicOn} onSpeechResult={handleSpeechResults} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
