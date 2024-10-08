// File: components/organisms/ChatPanel.tsx

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import BackgroundImage from '../../public/images/TEDxSDG.jpg';
import { useChat } from '../../components/state/hooks/useChat';
import dynamic from 'next/dynamic';
import VideoStream from './VideoStream';
import AudioStream from './AudioStream';
import ChatInput from '../atoms/ChatInput';
import ControlButtons from './ControlButtons';
import styles from '../../styles/components/organisms/ChatPanel.module.css';
import { useMedia } from '../../components/state/hooks/useMedia';
import Tools from './Tools';

const HeavyChatMessages = dynamic(() => import('../molecules/ChatMessages'), {
  loading: () => <div className={styles.emptyPlaceholder}></div>,
  ssr: false,
});

const ChatPanel: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null); // New state to hold error details
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChat = useCallback(
    async (input: string, isManual = false) => {
      const messageToSend = input.trim();
      if (messageToSend) {
        const prefix = isManual ? '' : '🎙️ ';
        const formattedMessage = `${prefix}${messageToSend}`;

        try {
          await sendActionToChatbot(formattedMessage);
          setChatInput(''); // Clear input after sending
          setError(null); // Clear any previous errors on successful send
          setErrorDetails(null); // Clear error details
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || 'Unexpected error occurred. Please try again.';
          const details = err.response?.data?.details || 'No additional details available.';
          setError(errorMessage);
          setErrorDetails(details);
        }
      }
    },
    [sendActionToChatbot]
  );

  return (
    <div className={`${styles.container} ${styles['Chat-panel']}`}>
      {error && (
        <div className={styles.error}>
          <strong>{error}</strong>
          {errorDetails && <p className={styles.errorDetails}>{errorDetails}</p>}
        </div>
      )}
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      <div className={mediaState.isPipOn ? styles.videoStreamHidden : styles.videoStream}>
        <VideoStream isCamOn={mediaState.isCamOn} videoRef={videoRef} />
      </div>
      
      <AudioStream isMicOn={mediaState.isMicOn} audioRef={audioRef} />

      <div className={styles.toolsLayer}>
        <Tools />
      </div>
      
      <div className={styles.chatLayer} ref={chatContainerRef}>
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
      </div>
    </div>
  );
};

export default React.memo(ChatPanel);
