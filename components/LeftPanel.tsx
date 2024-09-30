// components/LeftPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import BackgroundImage from '../public/TEDxSDG.jpg';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import dynamic from 'next/dynamic';
import VideoStream from './VideoStream';
import AudioStream from './AudioStream';
import ChatInput from './ChatInput';
import ControlButtons from './ControlButtons';
import styles from '../styles/LeftPanel.module.css';
import { useMedia } from '../hooks/useMedia';

const HeavyChatMessages = dynamic(() => import('./ChatMessages'), {
  loading: () => <p>Loading messages...</p>,
  ssr: false,
});

const LeftPanel: React.FC = () => {
  const {
    mediaState,
    videoRef,
    audioRef,
    startCam,
    stopCam,
    toggleMic,
    togglePip,
    toggleMem,
    eraseMemory,
  } = useMedia();

  const { messages, setMessages, sendActionToChatbot } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // UseRef to track the last final message to prevent duplicates
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

  // Handle speech recognition results
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      console.log(`Processing speech result: "${transcript}", isFinal: ${isFinal}`);
      if (transcript && transcript.trim()) {
        if (isFinal) {
          // Prevent duplicate processing of the same final message
          if (transcript !== lastFinalMessageRef.current) {
            lastFinalMessageRef.current = transcript; // Update ref instead of state
            console.log('Final transcript:', transcript.trim());

            // Remove interim message
            setMessages((prev) =>
              prev.filter((msg) => !(msg.isInterim && msg.sender === 'user'))
            );

            // Send the transcript to the chatbot (which will add the user message)
            handleChat(transcript.trim());
          } else {
            console.warn(`Duplicate final message detected: "${transcript}"`);
          }
        } else {
          // Handle interim results
          setMessages((prev) => {
            const existingInterimIndex = prev.findIndex(
              (msg) => msg.isInterim && msg.sender === 'user'
            );
            if (existingInterimIndex > -1) {
              return prev.map((msg, index) =>
                index === existingInterimIndex
                  ? { sender: 'user', text: transcript.trim(), isInterim: true }
                  : msg
              );
            } else {
              return [...prev, { sender: 'user', text: transcript.trim(), isInterim: true }];
            }
          });
        }
      }
    },
    [handleChat, setMessages]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(handleSpeechResult);

  // Toggle Microphone with Speech Recognition
  const toggleMicWithSpeechRecognition = useCallback(() => {
    console.log(`Toggling mic. Current state: ${mediaState.isMicOn}`);
    if (mediaState.isMicOn) {
      manuallyStoppedRef.current = true; // Mark as manually stopped
      stopHearing();
      toggleMic();
      console.log('Microphone and speech recognition stopped.');
    } else {
      manuallyStoppedRef.current = false; // Reset manual stop tracking
      toggleMic();
      startHearing();
      console.log('Microphone and speech recognition started.');
    }
  }, [mediaState.isMicOn, toggleMic, startHearing, stopHearing]);

  // Restart Mic if it's turned off unexpectedly
  useEffect(() => {
    console.log(`Mic state changed. Current state: ${mediaState.isMicOn}`);
    if (!mediaState.isMicOn && !manuallyStoppedRef.current) {
      console.log('Microphone turned off unexpectedly, restarting...');
      toggleMicWithSpeechRecognition();
    }
  }, [mediaState.isMicOn, toggleMicWithSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manuallyStoppedRef.current = true; // Ensure cleanup respects manual stop
      console.log('Cleaning up LeftPanel component.');
      stopCam();
      toggleMicWithSpeechRecognition(); // Ensure mic and hearing are stopped
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
      stopHearing();
    };
  }, [stopCam, mediaState.isPipOn, toggleMicWithSpeechRecognition, stopHearing]);

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
          <ChatInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChat={() => handleChat(chatInput)}
          />

          <ControlButtons
            isCamOn={mediaState.isCamOn}
            isMicOn={mediaState.isMicOn}
            toggleMic={toggleMicWithSpeechRecognition}
            startCam={startCam}
            stopCam={stopCam}
            isPipOn={mediaState.isPipOn}
            togglePip={togglePip}
            isMemOn={mediaState.isMemOn}
            toggleMem={toggleMem}
            eraseMemory={eraseMemory}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
