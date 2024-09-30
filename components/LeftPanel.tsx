// components/LeftPanel.tsx
'use client'; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import BackgroundImage from '../public/TEDxSDG.jpg';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VideoStream from './VideoStream';
import AudioStream from './AudioStream';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ControlButtons from './ControlButtons';
import styles from './LeftPanel.module.css';

const LeftPanel: React.FC = () => {
  const { messages, setMessages, sendActionToChatbot } = useChat();

  const [chatInput, setChatInput] = useState<string>('');
  const lastFinalMessageRef = useRef<string | null>(null);

  // Initialize mediaState with camera, mic, pip, and memory on by default
  const [mediaState, setMediaState] = useState({
    isCamOn: true,
    isMicOn: true,
    isPipOn: true,
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const updateMediaState = (key: keyof typeof mediaState, value: boolean) => {
    setMediaState((prev) => ({ ...prev, [key]: value }));
  };

  // Handle microphone operations
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        updateMediaState('isMicOn', true);
      }
    } catch (err) {
      console.error('Unable to access mic. Please check permissions.', err);
    }
  }, [audioRef, updateMediaState]);

  const stopMic = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    updateMediaState('isMicOn', false);
  }, [updateMediaState]);

  // Handle Picture-in-Picture (PiP) operations
  const startPip = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement !== videoRef.current) {
          await videoRef.current.requestPictureInPicture();
          updateMediaState('isPipOn', true);
        }
      } catch (err) {
        console.error('Unable to enter PiP mode:', err);
      }
    }
  }, [videoRef, updateMediaState]);

  const stopPip = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updateMediaState('isPipOn', false);
      }
    } catch (err) {
      console.error('Unable to exit PiP mode:', err);
    }
  }, [updateMediaState]);

  // Handle camera operations
  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        updateMediaState('isCamOn', true);

        if (mediaState.isPipOn) {
          await startPip();
        }

        if (!mediaState.isMicOn) await startMic();
      }
    } catch (err) {
      console.error('Unable to access cam. Please check permissions.', err);
    }
  }, [mediaState.isMicOn, mediaState.isPipOn, startMic, startPip, videoRef, updateMediaState]);

  const stopCam = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    updateMediaState('isCamOn', false);
    stopPip();
  }, [stopPip, updateMediaState]);

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

  const toggleMem = () => updateMediaState('isMemOn', !mediaState.isMemOn);

  const togglePip = useCallback(() => {
    mediaState.isPipOn ? stopPip() : startPip();
  }, [mediaState.isPipOn, startPip, stopPip]);

  useEffect(() => {
    startCam();
    startMicWithSpeechRecognition();
    updateMediaState('isMemOn', true);
  }, [startCam, startMicWithSpeechRecognition, updateMediaState]);

  useEffect(() => {
    return () => {
      stopCam();
      stopMic();
    };
  }, [stopCam, stopMic]);

  return (
    <div className={styles.container}>
      <Image
        src={BackgroundImage}
        alt="Background"
        fill
        className={styles.backgroundImage}
      />
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

export default LeftPanel;
