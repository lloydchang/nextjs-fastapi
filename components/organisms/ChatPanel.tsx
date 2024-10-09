// File: components/organisms/ChatPanel.tsx

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import BackgroundImage from '../../public/images/TEDxSDG.gif';
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChat = useCallback(
    async (input: string, isManual = false) => {
      const messageToSend = input.trim();
      if (messageToSend) {
        const prefix = isManual ? '' : '🎙️ ';
        const formattedMessage = `${prefix}${messageToSend}`;
        console.log(`ChatPanel - Sending message: ${formattedMessage}`);

        try {
          await sendActionToChatbot(formattedMessage);
          setChatInput('');
          setError(null);
          setErrorDetails(null);
        } catch (err: any) {
          console.error(`ChatPanel - Error sending message: ${err}`);
          setError('Failed to communicate with server.');
          setErrorDetails('Unknown error occurred.');
        }
      } else {
        console.warn('ChatPanel - Attempted to send an empty message.');
      }
    },
    [sendActionToChatbot]
  );

  return (
    <div className={`${styles.container} ${styles['Chat-panel']}`}>
      <ErrorDisplay error={error} errorDetails={errorDetails} />
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      <VideoStreamContainer isPipOn={mediaState.isPipOn} isCamOn={mediaState.isCamOn} videoRef={videoRef} />
      <AudioStream isMicOn={mediaState.isMicOn} audioRef={audioRef} />

      <div className={styles.toolsLayer}>
        <Tools />
      </div>
      
      <ChatContainer 
        chatContainerRef={chatContainerRef}
        messages={messages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleChat={handleChat}
        mediaState={mediaState}
        startCam={startCam}
        stopCam={stopCam}
        toggleMic={toggleMic}
        togglePip={togglePip}
        toggleMem={toggleMem}
        clearChatHistory={clearChatHistory}
      />
    </div>
  );
};

const ErrorDisplay: React.FC<{ error: string | null; errorDetails: string | null }> = ({ error, errorDetails }) => (
  error && (
    <div className={styles.error}>
      <strong>{error}</strong>
      {errorDetails && <p className={styles.errorDetails}>{errorDetails}</p>}
    </div>
  )
);

const VideoStreamContainer: React.FC<{ isPipOn: boolean; isCamOn: boolean; videoRef: React.RefObject<HTMLVideoElement> }> = ({ isPipOn, isCamOn, videoRef }) => (
  <div className={isPipOn ? styles.videoStreamHidden : styles.videoStream}>
    <VideoStream isCamOn={isCamOn} videoRef={videoRef} />
  </div>
);

const ChatContainer: React.FC<{
  chatContainerRef: React.RefObject<HTMLDivElement>;
  messages: any[];
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChat: (input: string, isManual: boolean) => Promise<void>;
  mediaState: any;
  startCam: () => void;
  stopCam: () => void;
  toggleMic: () => void;
  togglePip: () => void;
  toggleMem: () => void;
  clearChatHistory: () => void;
}> = ({ chatContainerRef, messages, chatInput, setChatInput, handleChat, mediaState, startCam, stopCam, toggleMic, togglePip, toggleMem, clearChatHistory }) => (
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
);

export default React.memo(ChatPanel);
