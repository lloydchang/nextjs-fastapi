// components/LeftPanel.tsx
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
import TestSpeechRecognition from './TestSpeechRecognition';
import { updateFinalResult, updateInterimResult, trimOverlap } from '../utils/chatUtils';

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <p>Loading messages...</p>,
  ssr: false,
});

const LeftPanel: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages, setMessages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChat = useCallback(
    async (input: string, isManual = false, isFinal = false) => {
      // If input is a manual message, do not trim it
      const messageToSend = isManual ? input : input.trim();
      
      if (messageToSend) {
        const prefix = isManual ? "" : isFinal ? "🎙️ " : "🎤 ";
        const formattedMessage = `${prefix}${messageToSend}`;
        await sendActionToChatbot(formattedMessage);
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
        <h1 className={styles.title}><b>Ideas change everything</b></h1>
        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}>Chat with <span className={styles.tedx}>TEDx</span><span className={styles.sdg}>SDG</span></h3>
          <HeavyChatMessages messages={messages} />
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={() => handleChat(chatInput, true)} />
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
          <TestSpeechRecognition
            isMicOn={mediaState.isMicOn}
            onSpeechResult={(finalResults) => handleChat(finalResults, false, true)} // Use 🎙️ for final
            onInterimUpdate={(interimResult) => handleChat(interimResult, false, false)} // Use 🎤 for interim
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
