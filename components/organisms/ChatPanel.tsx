// File: components/organisms/ChatPanel.tsx

'use client'; // Mark as Client Component

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { sendMessage, clearMessages } from 'store/chatSlice';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import BackgroundImage from 'public/images/TEDxSDG.webp';
import styles from 'styles/components/organisms/ChatPanel.module.css';
import useMedia from 'components/state/hooks/useMedia';
import ChatInput from 'components/organisms/ChatInput';
import InterimSpeechInput from 'components/atoms/InterimSpeechInput'; // New Component
import Tools from 'components/organisms/Tools';
import { Message } from 'types';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition'; // Ensure correct path

const HeavyChatMessages = dynamic(() => import('components/molecules/ChatMessages'), {
  ssr: false,
}) as React.ComponentType<{ messages: Message[]; isFullScreen: boolean }>;

const ChatPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chat.messages);
  const {
    mediaState,
    toggleMic,
    startCam,
    stopCam,
    togglePip,
    toggleMem,
  } = useMedia();
  const [chatInput, setChatInput] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>(''); // New state for interim speech
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref to handle scrolling

  useEffect(() => {
    console.log('ChatPanel - Messages state updated in ChatPanel from Redux:', messages);
    if (!isFullScreen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFullScreen]);

  // Determine if there are any visible messages
  const hasVisibleMessages = messages.some((message) => !message.hidden);

  const handleChat = useCallback(() => {
    if (chatInput.trim()) {
      const messageToSend = chatInput.trim();
      setChatInput(''); // Clear the typed input
      dispatch(sendMessage(messageToSend));
      console.log('ChatPanel - Message sent:', messageToSend);
    }
  }, [dispatch, chatInput]);

  const handleClearChat = () => {
    dispatch(clearMessages());
    console.log('ChatPanel - Chat history cleared.');
  };

  const toggleFullScreenMode = () => {
    const elem = document.documentElement;

    if (!isFullScreen) {
      elem.requestFullscreen().catch((err) => {
        console.error(`Failed to enter fullscreen mode: ${err.message}`);
      });
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error(`Failed to exit fullscreen mode: ${err.message}`);
        });
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  // Handle final speech results
  const handleSpeechResult = useCallback(
    (finalResult: string) => {
      console.log('ChatPanel - Speech recognized (Final):', finalResult);
      if (finalResult.trim()) {
        dispatch(sendMessage({ text: finalResult.trim(), hidden: false }));
        console.log('ChatPanel - Final speech sent as message:', finalResult.trim());
      }
      setInterimSpeech(''); // Clear interim speech
      setChatInput(''); // Clear typed input if any
    },
    [dispatch]
  );

  // Handle interim speech updates
  const handleInterimUpdate = useCallback((interimResult: string) => {
    console.log('ChatPanel - Interim Result:', interimResult);
    setInterimSpeech(interimResult);
  }, []);

  // Initialize the Speech Recognition Hook
  const { isListening } = useSpeechRecognition({
    isMicOn: mediaState.isMicOn,
    onSpeechResult: handleSpeechResult,
    onInterimUpdate: handleInterimUpdate,
  });

{isListening && (
  <div className={styles.listeningIndicator}>
    <span>🎤 Listening...</span>
    <div className={styles.pulse}></div>
  </div>
)}

  return (
    <div
      className={`${styles.container} ${
        isFullScreen ? styles.fullScreenMode : styles['Chat-panel']
      }`}
    >

      {isListening && (
        <div className={styles.listeningIndicator}>
          <span>🎤 Listening...</span>
          <div className={styles.pulse}></div>
        </div>
      )}

      <Image
        src={BackgroundImage}
        alt=""
        fill
        className={styles.backgroundImage}
        priority
        unoptimized
      />
      <div className={styles.overlay} />

      <div className={`${styles.container} ${styles['Chat-panel']}`}>
        <div className={`${styles.toolsLayer} ${isFullScreen ? styles.minimized : ''}`}>
          <Tools />
        </div>

        <div className={`${styles.chatLayer} ${isFullScreen ? styles.fullScreenChat : ''}`}>
          <HeavyChatMessages messages={messages} isFullScreen={isFullScreen} />

          {/* Interim Speech Input */}
          <InterimSpeechInput interimSpeech={interimSpeech} />

          <ChatInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChat={handleChat}
            isCamOn={mediaState.isCamOn}
            isMicOn={mediaState.isMicOn}
            toggleMic={toggleMic}
            startCam={startCam}
            stopCam={stopCam}
            isPipOn={mediaState.isPipOn}
            togglePip={togglePip}
            isMemOn={mediaState.isMemOn}
            toggleMem={toggleMem}
            eraseMemory={handleClearChat}
            isFullScreenOn={isFullScreen}
            toggleFullScreen={toggleFullScreenMode}
            hasVisibleMessages={hasVisibleMessages} // Pass down visible messages state
            isListening={isListening} // Pass isListening to ChatInput
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatPanel);
