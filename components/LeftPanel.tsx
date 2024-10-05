// components/LeftPanel.tsx

import React, { useState, useRef, useCallback } from 'react';
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
import ProjectPlan from './ProjectPlan';

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <div className={styles.emptyPlaceholder}></div>, // Invisible placeholder to maintain layout
  ssr: false,
});

const LeftPanel: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChat = useCallback(
    (input: string, isManual = false) => {
      const messageToSend = input.trim();
      
      if (messageToSend) {
        const prefix = isManual ? "" : "🎙️ ";
        const formattedMessage = `${prefix}${messageToSend}`;
        sendActionToChatbot(formattedMessage);
        setChatInput(''); // Clear input after sending
      }
    },
    [sendActionToChatbot]
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
        {/* Top 40% for the Business Plan */}
        <div className={styles.businessPlanContainer}>
          <ProjectPlan messages={messages} />
        </div>
        
        {/* Bottom 60% for the Chat Interface */}
        <div className={styles.chatInterface} ref={chatContainerRef}>
          <HeavyChatMessages messages={messages} />
          <ChatInput 
            chatInput={chatInput} 
            setChatInput={setChatInput} 
            handleChat={() => handleChat(chatInput, true)} 
          />
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
            eraseMemory={clearChatHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
