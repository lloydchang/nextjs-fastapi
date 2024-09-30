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
import TestSpeechRecognition from './TestSpeechRecognition'; // Assuming this is the component for testing

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
  } = useMedia();

  const { messages, setMessages, sendActionToChatbot, eraseMemory } = useChat({ isMemOn: mediaState.isMemOn });

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

  // Start Microphone with Speech Recognition
  const startMicWithSpeechRecognition = useCallback(async () => {
    try {
      manuallyStoppedRef.current = false; // Reset manual stop tracking
      console.log('Starting microphone and speech recognition.');
      toggleMic(); // Toggle mic on
      startHearing();
      console.log('Microphone and speech recognition started.');
    } catch (err) {
      console.error('Unable to access mic with speech recognition.', err);
      setError('Unable to access microphone.');
    }
  }, [toggleMic, startHearing]);

  // Stop Microphone with Speech Recognition
  const stopMicWithSpeechRecognition = useCallback(() => {
    console.log('Stopping speech recognition and microphone.');
    manuallyStoppedRef.current = true; // Mark as manually stopped
    stopHearing();
    toggleMic(); // Toggle mic off
    console.log('Speech recognition and microphone stopped.');
  }, [stopHearing, toggleMic]);

  // Toggle Microphone with Speech Recognition
  const toggleMicWithSpeechRecognition = useCallback(() => {
    console.log(`Toggling mic. Current state: ${mediaState.isMicOn}`);
    mediaState.isMicOn ? stopMicWithSpeechRecognition() : startMicWithSpeechRecognition();
  }, [mediaState.isMicOn, startMicWithSpeechRecognition, stopMicWithSpeechRecognition]);

  // Restart Mic if it's turned off unexpectedly
  useEffect(() => {
    console.log(`Mic state changed. Current state: ${mediaState.isMicOn}`);
    if (!mediaState.isMicOn && !manuallyStoppedRef.current) {
      console.log('Microphone turned off unexpectedly, restarting...');
      startMicWithSpeechRecognition();
    }
  }, [mediaState.isMicOn, startMicWithSpeechRecognition]);

  // Cleanup on unmount
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
      stopHearing();
    };
  }, [stopCam, toggleMic, mediaState.isPipOn, stopHearing]);

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
            eraseMemory={eraseMemory} // Pass eraseMemory function
          />

          {/* Test Speech Recognition Component */}
          <TestSpeechRecognition />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
