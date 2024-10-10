// File: components/organisms/ChatPanel.tsx

'use client'; // Mark as Client Component

import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store'; // Import AppDispatch and RootState types
import { sendMessage, clearMessages } from 'store/chatSlice';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import BackgroundImage from 'public/images/TEDxSDG.gif';
import styles from 'styles/components/organisms/ChatPanel.module.css';
import { useMedia } from 'components/state/hooks/useMedia';
import ControlButtons from 'components/organisms/ControlButtons';
import ChatInput from 'components/atoms/ChatInput';
import Tools from 'components/organisms/Tools';
import VideoStream from 'components/organisms/VideoStream';
import AudioStream from 'components/organisms/AudioStream';

// Dynamic import for heavy components to reduce initial load
const HeavyChatMessages = dynamic(() => import('components/molecules/ChatMessages'), {
  ssr: false,
});

const ChatPanel: React.FC = () => {
  // Use `AppDispatch` type to ensure correct dispatch typing
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

  return (
    <div className={`${styles.container} ${styles['Chat-panel']}`}>
      {/* Background Image */}
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      {/* Chat Panel Container */}
      <div className={`${styles.container} ${styles['Chat-panel']}`}>
        {/* Tools Layer */}
        <div className={styles.toolsLayer}>
          <Tools />
        </div>

        {/* Chat Layer */}
        <div className={styles.chatLayer}>
          <HeavyChatMessages />
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
