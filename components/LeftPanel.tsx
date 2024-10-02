// components/LeftPanel.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import TestSpeechRecognition from './TestSpeechRecognition';
import { Message } from '../types';

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <p>Loading messages...</p>,
  ssr: false,
});

const LeftPanel: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages: botMessages, sendActionToChatbot, clearChatHistory } = useChat();

  const [chatInput, setChatInput] = useState<string>('');
  const [combinedMessages, setCombinedMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Function to handle user chat
  const handleChat = useCallback(
    (input: string) => {
      if (input.trim()) {
        // Create user message
        const userMessage: Message = {
          id: generateUniqueId(),
          type: 'user',
          text: input.trim(),
        };

        // Add user message to combined messages immediately
        setCombinedMessages(prev => [...prev, userMessage]);

        // Send message to chatbot asynchronously
        sendActionToChatbot(userMessage.text);
      }
    },
    [sendActionToChatbot]
  );

  // Effect to append bot messages to combined messages
  useEffect(() => {
    if (botMessages.length === 0) return;
    
    const latestBotMessage = botMessages[botMessages.length - 1];
    setCombinedMessages(prev => [...prev, latestBotMessage]);
  }, [botMessages]);

  // Function to clear chat history
  const handleClearChat = useCallback(() => {
    clearChatHistory();
    setCombinedMessages([]);
  }, [clearChatHistory]);

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
        <h1 className={styles.title}><b>Ideas change everything</b></h1>
        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}><b>Chat with TEDxSDG</b></h3>
          <HeavyChatMessages messages={combinedMessages} />
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} />
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
            eraseMemory={handleClearChat}
          />
          <TestSpeechRecognition
            isMicOn={mediaState.isMicOn}
            onSpeechResult={(finalResults) => handleChat(finalResults)}
            onInterimUpdate={(interimResult) => handleChat(interimResult)}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);

// Utility to generate unique IDs
const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
