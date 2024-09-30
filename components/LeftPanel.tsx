// components/LeftPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Image from 'next/image';
import BackgroundImage from '../public/TEDxSDG.jpg';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VideoStream from './VideoStream';
import AudioStream from './AudioStream';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ControlButtons from './ControlButtons';
import styles from '../styles/LeftPanel.module.css';
import { useMedia } from '../hooks/useMedia';
import dynamic from 'next/dynamic';

// Lazy load any heavy components if necessary
// Example: if there was a HeavyComponent, we could lazy load it
// const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
//   loading: () => <p>Loading Heavy Component...</p>,
//   ssr: false,
// });

const LeftPanel: React.FC = () => {
  const {
    mediaState,
    videoRef,
    audioRef,
    startCam,
    stopCam,
    startMic,
    stopMic,
    togglePip,
    toggleMem,
  } = useMedia();

  const { messages, setMessages, sendActionToChatbot } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const lastFinalMessageRef = useRef<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      if (transcript && transcript.trim()) {
        if (isFinal) {
          if (transcript !== lastFinalMessageRef.current) {
            lastFinalMessageRef.current = transcript;
            console.log('Final transcript:', transcript.trim());

            // Remove interim message
            setMessages((prev) =>
              prev.filter((msg) => !(msg.isInterim && msg.sender === 'user'))
            );

            // Add the final message to chat
            setMessages((prev) => [...prev, { sender: 'user', text: transcript.trim() }]);

            // Send the transcript to the chatbot
            handleChat(transcript.trim());
          }
        } else {
          console.log('Interim transcript:', transcript.trim());
          // Update interim message in messages
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
              return [
                ...prev,
                { sender: 'user', text: transcript.trim(), isInterim: true },
              ];
            }
          });
        }
      }
    },
    [handleChat, setMessages]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(handleSpeechResult);

  const startMicWithSpeechRecognition = useCallback(async () => {
    try {
      await startMic();
      startHearing();
    } catch (err) {
      console.error('Unable to access mic with speech recognition.', err);
      setError('Unable to access microphone.');
    }
  }, [startMic, startHearing]);

  const stopMicWithSpeechRecognition = useCallback(() => {
    stopHearing();
    stopMic();
  }, [stopHearing, stopMic]);

  const toggleMicWithSpeechRecognition = useCallback(() => {
    mediaState.isMicOn
      ? stopMicWithSpeechRecognition()
      : startMicWithSpeechRecognition();
  }, [mediaState.isMicOn, startMicWithSpeechRecognition, stopMicWithSpeechRecognition]);

  useEffect(() => {
    // Start camera and microphone with speech recognition on component mount
    startCam();
    startMicWithSpeechRecognition();
    // Memory is toggled based on initial state; if you want it enabled by default, ensure isMemOn is true
  }, [startCam, startMicWithSpeechRecognition]);

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      stopCam();
      stopMic();
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
      stopHearing();
    };
  }, [stopCam, stopMic, mediaState.isPipOn, stopHearing]);

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} priority />
      <div className={styles.overlay} />

      {/* VideoStream with conditional styles based on isPipOn */}
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

          <ChatMessages messages={messages} />
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
          />
        </div>
      </div>
    </div>
  );
};

// Memoize LeftPanel to prevent unnecessary re-renders
export default React.memo(LeftPanel);
