// File: components/organisms/ChatPanel.tsx

'use client'; // Mark as Client Component

import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { sendMessage, clearMessages, addMessage } from 'store/chatSlice';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import BackgroundImage from 'public/images/TEDxSDG.gif';
import styles from 'styles/components/organisms/ChatPanel.module.css';
import { useMedia } from 'components/state/hooks/useMedia';
import ControlButtons from 'components/organisms/ControlButtons';
import ChatInput from 'components/atoms/ChatInput';
import Tools from 'components/organisms/Tools';
import { Message } from 'types';

// Dynamic import for heavy components to reduce initial load
const HeavyChatMessages = dynamic(() => import('components/molecules/ChatMessages'), {
  ssr: false,
}) as React.FC<{ messages: Message[] }>;

const ChatPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chat.messages);
  const { mediaState, toggleMic, startCam, stopCam, togglePip, toggleMem } = useMedia();
  const [chatInput, setChatInput] = useState<string>('');

  useEffect(() => {
    console.log('ChatPanel - Messages state updated in ChatPanel from Redux:', messages);
  }, [messages]);

  const handleChat = useCallback(() => {
    if (chatInput.trim()) {
      dispatch(sendMessage(chatInput)); // Send the chat message to the API and store it in Redux
      setChatInput(''); // Clear the input field
    }
  }, [dispatch, chatInput]);

  const handleClearChat = () => {
    dispatch(clearMessages());
    console.log('ChatPanel - Chat history cleared.');
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/chat');

    eventSource.onmessage = (event) => {
      if (event.data !== '[DONE]') {
        try {
          const parsedData = JSON.parse(event.data);
          dispatch(addMessage({
            id: parsedData.id || Date.now().toString(),
            sender: 'bot',
            text: parsedData.message,
            role: parsedData.persona || 'bot',
            content: parsedData.message,
          }));
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
    <div className={`${styles.container} ${styles['Chat-panel']}`}>
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      <div className={`${styles.container} ${styles['Chat-panel']}`}>
        <div className={styles.toolsLayer}>
          <Tools />
        </div>

        <div className={styles.chatLayer}>
          <HeavyChatMessages messages={messages} />
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} />
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
            eraseMemory={handleClearChat}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatPanel);
