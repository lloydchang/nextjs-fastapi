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
import { useMedia } from 'components/state/hooks/useMedia';
import ChatInput from 'components/organisms/ChatInput';
import Tools from 'components/organisms/Tools';
import { Message } from 'types';

// Dynamic import for heavy components to reduce initial load
const HeavyChatMessages = dynamic(() => import('components/molecules/ChatMessages'), {
  ssr: false,
}) as React.ComponentType<{ messages: Message[]; isFullScreen: boolean }>;

const ChatPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chat.messages);
  const { mediaState, toggleMic, startCam, stopCam, togglePip, toggleMem } = useMedia();
  const [chatInput, setChatInput] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref to handle scrolling

  useEffect(() => {
    console.log('ChatPanel - Messages state updated in ChatPanel from Redux:', messages);
    // Conditionally scroll to the bottom only when not in full-screen mode
    if (!isFullScreen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFullScreen]);

  const handleChat = useCallback(() => {
    if (chatInput.trim()) {
      const messageToSend = chatInput;
      setChatInput(''); // Clear the input immediately
      dispatch(sendMessage(messageToSend));
    }
  }, [dispatch, chatInput]);

  const handleClearChat = () => {
    dispatch(clearMessages());
    console.log('ChatPanel - Chat history cleared.');
  };

  // Function to toggle full-screen mode using standard API
  const toggleFullScreen = () => {
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

  return (
    <div
      className={`${styles.container} ${
        isFullScreen ? styles.fullScreenMode : styles['Chat-panel']
      }`}
    >
      {/* Add priority attribute to optimize loading for LCP */}
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
          {/* Optional: Hide or shrink Tools when in Full Screen mode */}
          <Tools />
        </div>

        <div ref={scrollRef} className={`${styles.chatLayer} ${isFullScreen ? styles.fullScreenChat : ''}`}>
          <HeavyChatMessages messages={messages} isFullScreen={isFullScreen} />
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
            toggleFullScreen={toggleFullScreen}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatPanel);
