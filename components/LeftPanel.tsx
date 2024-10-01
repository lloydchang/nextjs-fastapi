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

  // Refs for tracking final messages and user action
  const lastFinalMessageRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const manuallyStoppedRef = useRef<boolean>(false);

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

  // Auto-scroll to the bottom when a new message is added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      manuallyStoppedRef.current = true; // Ensure cleanup respects manual stop
      console.log('Cleaning up LeftPanel component.');
      stopCam();
      toggleMic(); // Ensure mic is stopped
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
    };
  }, [stopCam, toggleMic, mediaState.isPipOn]);

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      {/* Display Microphone Status */}
      <div className={styles.micStatus}>
        <strong>Microphone Status: {mediaState.isMicOn ? 'ON 🎤' : 'OFF 🎤'}</strong>
      </div>

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
        <div className={styles.chatInterface} ref={chatContainerRef}>
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
          <TestSpeechRecognition isMicOn={mediaState.isMicOn} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
