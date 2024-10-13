// File: components/organisms/ChatPanel.tsx

'use client'; // Mark as Client Component

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { sendMessage, clearMessages, addMessage } from 'store/chatSlice';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false); // State for Full Screen mode

  const highQualityImage = '/images/TEDxSDG-1024×924.webp'; // High-quality image

  const handleChat = () => {
    if (chatInput.trim()) {
      dispatch(sendMessage(chatInput)); // Send the chat message to the API and store it in Redux
      setChatInput(''); // Clear the input field
    }
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
    console.log('ChatPanel - Chat history cleared.');
  };

  // Function to toggle full-screen mode using standard API
  const toggleFullScreen = () => {
    const elem = document.documentElement;

    if (!isFullScreen) {
      // Enter fullscreen mode using standard API
      elem.requestFullscreen().catch((err) => {
        console.error(`Failed to enter fullscreen mode: ${err.message}`);
      });
    } else {
      // Exit fullscreen mode using standard API
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error(`Failed to exit fullscreen mode: ${err.message}`);
        });
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/chat');

    eventSource.onmessage = (event) => {
      if (event.data !== '[DONE]') {
        try {
          const parsedData = JSON.parse(event.data);
          dispatch(
            addMessage({
              id: parsedData.id || Date.now().toString(),
              sender: 'bot',
              text: parsedData.message,
              role: parsedData.persona || 'bot',
              content: parsedData.message,
            })
          );
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      } else {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [dispatch]);

  return (
    <div className={`${styles.container} ${isFullScreen ? styles.fullScreenMode : styles['Chat-panel']}`}>
      {/* Render high-quality image */}
      <Image
        src={highQualityImage}
        alt="High-Quality Background"
        fill
        className={styles.backgroundImage}
      />

      <div className={styles.overlay} />

      <div className={`${styles.container} ${styles['Chat-panel']}`}>
        <div className={`${styles.toolsLayer} ${isFullScreen ? styles.minimized : ''}`}>
        </div>

        <div className={`${styles.chatLayer} ${isFullScreen ? styles.fullScreenChat : ''}`}>
          {/* Pass `isFullScreen` prop along with messages */}
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
