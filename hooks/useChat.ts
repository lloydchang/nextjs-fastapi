// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

// Utility functions to handle local storage operations for saving and loading chat history
const saveChatHistory = (messages: Message[]) => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
};

const loadChatHistory = (): Message[] => {
  const history = localStorage.getItem('chatHistory');
  return history ? JSON.parse(history) : [];
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>(loadChatHistory()); // Load chat history on initialization
  const [context, setContext] = useState<string | null>(null); // Store the context returned by the chatbot
  const [isMemEnabled, setIsMemEnabled] = useState<boolean>(true); // Memory enabled by default
  const [isCamOn, setIsCamOn] = useState<boolean>(true); // Cam enabled by default
  const [isPiPOn, setIsPiPOn] = useState<boolean>(true); // Picture-in-Picture enabled by default
  const [isMicOn, setIsMicOn] = useState<boolean>(true); // Mic enabled by default

  // Save chat history whenever messages change and memory is enabled
  useEffect(() => {
    if (isMemEnabled) {
      saveChatHistory(messages);
    }
  }, [messages, isMemEnabled]);

  // Initialize Cam, PiP, and Mic when component mounts
  useEffect(() => {
    if (isCamOn) startCam();
    if (isPiPOn) startPiP();
    if (isMicOn) startMic();
  }, [isCamOn, isPiPOn, isMicOn]);

  const sendActionToChatbot = async (input: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');

    try {
      await sendMessageToChatbot(
        systemPrompt,
        input,
        `${conversationHistory}\nuser: ${input}`,
        (responseMessage, newContext) => {
          if (newContext) setContext(newContext);
          setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
        }
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'TEDxSDG', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    }
  };

  const toggleMem = () => {
    setIsMemEnabled((prev) => {
      const newMemState = !prev;
      if (!newMemState) {
        localStorage.removeItem('chatHistory');
        setMessages([]);
      }
      return newMemState;
    });
  };

  const startMic = () => console.log('Mic started');
  const stopMic = () => console.log('Mic stopped');
  const startCam = () => console.log('Cam started');
  const stopCam = () => console.log('Cam stopped');
  const startPiP = () => console.log('Picture-in-Picture started');
  const stopPiP = () => console.log('Picture-in-Picture stopped');

  return {
    messages,
    sendActionToChatbot,
    context,
    isMemEnabled,
    toggleMem,
    isCamOn,
    toggleCam: () => setIsCamOn((prev) => !prev),
    isPiPOn,
    togglePiP: () => setIsPiPOn((prev) => !prev),
    isMicOn,
    toggleMic: () => setIsMicOn((prev) => !prev),
    startMic,
    stopMic,
    startCam,
    stopCam,
    startPiP,
    stopPiP,
  };
};
