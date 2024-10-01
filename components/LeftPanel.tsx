// components/LeftPanel.tsx

'use client';

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
import { updateFinalResult, updateInterimResult } from '../utils/chatUtils'; // Import utility functions

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
    async (input: string, isFinal = true) => {
      if (input.trim()) {
        try {
          if (isFinal) {
            // Only send final results if they are unique
            if (updateFinalResult(input)) {
              const prefixedFinal = `[final] ${input}`; // Prefix final results
              setMessages((prev) => [...prev, { sender: 'user', text: prefixedFinal }]);
              await sendActionToChatbot(prefixedFinal); // Send final result to chatbot
              setChatInput('');
            }
          } else {
            // Deduplication check for interim results
            if (updateInterimResult(input)) {
              const prefixedInterim = `[interim] ${input}`; // Prefix interim results
              console.log('Sending interim to chatbot:', prefixedInterim); // Debug Log for interim results
              setMessages((prev) => [...prev, { sender: 'user', text: prefixedInterim, isInterim: true }]);
            }
          }
        } catch (error) {
          setError('Failed to send message.');
        }
      }
    },
    [sendActionToChatbot]
  );

  const handleSpeechResults = useCallback(
    (results: string) => {
      console.log('Final Speech Result:', results); // Debug Log
      handleChat(results, true); // Handle final results
    },
    [handleChat]
  );

  const handleInterimUpdates = useCallback(
    (interimResult: string) => {
      console.log('Interim Speech Update:', interimResult); // Debug Log
      handleChat(interimResult, false); // Send interim results as non-final
    },
    [handleChat]
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      stopCam();
      toggleMic();
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch(console.error);
      }
    };
  }, [stopCam, toggleMic, mediaState.isPipOn]);

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
            eraseMemory={clearChatHistory}
          />

          {/* Test Speech Recognition Component */}
          <TestSpeechRecognition
            isMicOn={mediaState.isMicOn}
            onSpeechResult={handleSpeechResults}
            onInterimUpdate={handleInterimUpdates}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
