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
import { updateFinalResult, updateInterimResult, trimOverlap } from '../utils/chatUtils'; // Import utility functions

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <p>Loading messages...</p>,
  ssr: false,
});

const LeftPanel: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages, setMessages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastMessageType, setLastMessageType] = useState<'interim' | 'final' | 'manual'>('manual');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleChat = useCallback(
    async (input: string, isFinal = true, isManual = false) => {
      if (input.trim()) {
        try {
          let processedInput = input.trim();

          if (isFinal) {
            if (lastMessageType === 'interim') {
              // Trim overlapping words when a final follows an interim
              processedInput = trimOverlap(input, lastInterimResult);
            }

            // Manually typed messages should not be prefixed
            if (isManual || updateFinalResult(processedInput)) {
              const messagePrefix = isManual ? '' : '🎙️ '; // Use 🎙️ prefix for speech-recognized final results
              const formattedMessage = `${messagePrefix}${processedInput}`;
              setMessages((prev) => [...prev, { sender: 'user', text: formattedMessage }]);
              await sendActionToChatbot(formattedMessage); // Send final result to chatbot
              setChatInput('');
              setLastMessageType('final');
            }
          } else {
            if (lastMessageType === 'interim') {
              // Trim overlapping words when an interim follows another interim
              processedInput = trimOverlap(input, lastInterimResult);
            }

            if (updateInterimResult(processedInput)) {
              const formattedInterim = `🎤 ${processedInput}`; // Prefix interim results
              setMessages((prev) => [...prev, { sender: 'user', text: formattedInterim, isInterim: true }]);
              setLastMessageType('interim');
            }
          }
        } catch (error) {
          setError('Failed to send message.');
        }
      }
    },
    [sendActionToChatbot, lastMessageType]
  );

  const handleSpeechResults = useCallback(
    (results: string) => {
      handleChat(results, true, false); // Speech results are not manual
    },
    [handleChat]
  );

  const handleInterimUpdates = useCallback(
    (interimResult: string) => {
      handleChat(interimResult, false, false); // Speech interims are not manual
    },
    [handleChat]
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={() => handleChat(chatInput, true, true)} />

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
