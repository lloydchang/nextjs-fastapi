// components/ChatInterface.tsx

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { useMedia } from '../hooks/useMedia';
import HeavyChatMessages from './ChatMessages'; // Assuming this component exists
import ChatInput from './ChatInput'; // Assuming this component exists
import ControlButtons from './ControlButtons'; // Assuming this component exists
import styles from '../styles/LeftPanel.module.css';
import TestSpeechRecognition from './TestSpeechRecognition'; // Assuming this component exists

const ChatInterface: React.FC = () => {
  const { mediaState, videoRef, audioRef, startCam, stopCam, toggleMic, togglePip, toggleMem } = useMedia();
  const { messages, setMessages, sendActionToChatbot, clearChatHistory } = useChat({ isMemOn: mediaState.isMemOn });

  const [chatInput, setChatInput] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [lastMessageType, setLastMessageType] = React.useState<'interim' | 'final' | 'manual'>('manual');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastInterimResult = useRef<string>(''); // Track the last interim result for deduplication

  const handleChat = useCallback(
    async (input: string, isFinal = true, isManual = false) => {
      if (input.trim()) {
        try {
          let processedInput = input.trim();

          if (isFinal) {
            // Final message handling
            const messagePrefix = isManual ? '' : '🎙️ ';
            const formattedMessage = `${messagePrefix}${processedInput}`;
            setMessages((prev) => [...prev, { sender: 'user', text: formattedMessage }]);
            await sendActionToChatbot(formattedMessage); // Send final result to chatbot
            setChatInput('');
            setLastMessageType('final');
          } else {
            // Interim message handling
            if (updateInterimResult(processedInput)) {
              const formattedInterim = `🎤 ${processedInput}`; // Prefix interim results
              setMessages((prev) => [...prev, { sender: 'user', text: formattedInterim, isInterim: true }]);
              lastInterimResult.current = processedInput; // Update last interim result
              setLastMessageType('interim');
            }
          }
        } catch (error) {
          setError('Failed to send message.');
        }
      }
    },
    [sendActionToChatbot]
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatInterface} ref={chatContainerRef}>
      <h3 className={styles.chatHeader}>
        <b>Chat with TEDxSDG</b>
      </h3>
      <HeavyChatMessages messages={messages} />
      <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={() => handleChat(chatInput, true, true)} />
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
        eraseMemory={clearChatHistory}
      />
      <TestSpeechRecognition
        isMicOn={mediaState.isMicOn}
        onSpeechResult={(results) => handleChat(results, true, false)} // Speech results are not manual
        onInterimUpdate={(interimResult) => handleChat(interimResult, false, false)} // Speech interims are not manual
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default ChatInterface;
