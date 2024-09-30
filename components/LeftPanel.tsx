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

  useEffect(() => {
    startCam();
    startMic();
    updateMediaState('isMemOn', true);
  }, [startCam, startMic, updateMediaState]);

  return (
    <div className={styles.container}>
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      {/* Rest of your component's JSX */}
    </div>
  );
};

export default LeftPanel;
