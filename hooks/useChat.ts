// hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

// Utility functions to handle local storage operations for saving and loading chat history
const saveChatHistory = (messages: Message[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }
};

const loadChatHistory = (): Message[] => {
  if (typeof window !== 'undefined') {
    const history = localStorage.getItem('chatHistory');
    return history ? JSON.parse(history) : [];
  }
  return [];
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>(loadChatHistory()); // Load chat history on initialization
  const [context, setContext] = useState<string | null>(null); // Store the context returned by the chatbot
  const [isMemEnabled, setIsMemEnabled] = useState<boolean>(true); // Memory enabled by default
  const [isCamOn, setIsCamOn] = useState<boolean>(true); // Cam enabled by default
  const [isPiPOn, setIsPiPOn] = useState<boolean>(true); // Picture-in-Picture enabled by default
  const [isMicOn, setIsMicOn] = useState<boolean>(true); // Mic enabled by default

  // Ref to keep track of the latest messages state
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Save chat history whenever messages change and memory is enabled
  useEffect(() => {
    if (isMemEnabled) {
      saveChatHistory(messages);
    }
  }, [messages, isMemEnabled]);

  // Handle Mic state changes
  useEffect(() => {
    if (isMicOn) {
      startMic();
    } else {
      stopMic();
    }
  }, [isMicOn]);

  // Handle Cam state changes
  useEffect(() => {
    if (isCamOn) {
      startCam();
    } else {
      stopCam();
    }
  }, [isCamOn]);

  // Handle PiP state changes
  useEffect(() => {
    if (isPiPOn) {
      startPiP();
    } else {
      stopPiP();
    }
  }, [isPiPOn]);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Update messages state and ref
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, { sender: 'user', text: input }];
        messagesRef.current = updatedMessages;
        return updatedMessages;
      });

      // Use messagesRef to get the latest messages
      const conversationHistory = messagesRef.current
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join('\n');

      try {
        await sendMessageToChatbot(
          systemPrompt,
          input,
          conversationHistory,
          (responseMessage, newContext) => {
            if (newContext) setContext(newContext);
            setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
          }
        );
      } catch (error) {
        console.error('Error sending message to chatbot:', error);
        setMessages((prev) => [
          ...prev,
          { sender: 'TEDxSDG', text: 'Sorry, something went wrong. Please try again.' },
        ]);
      }
    },
    [setMessages, setContext]
  );

  const toggleMem = useCallback(() => {
    setIsMemEnabled((prev) => {
      const newMemState = !prev;
      if (!newMemState && typeof window !== 'undefined') {
        localStorage.removeItem('chatHistory');
        setMessages([]);
      }
      return newMemState;
    });
  }, [setIsMemEnabled, setMessages]);

  const startMic = useCallback(() => {
    console.log('Mic started');
    // Add your logic to start the microphone
  }, []);

  const stopMic = useCallback(() => {
    console.log('Mic stopped');
    // Add your logic to stop the microphone
  }, []);

  const startCam = useCallback(() => {
    console.log('Cam started');
    // Add your logic to start the camera
  }, []);

  const stopCam = useCallback(() => {
    console.log('Cam stopped');
    // Add your logic to stop the camera
  }, []);

  const startPiP = useCallback(() => {
    console.log('Picture-in-Picture started');
    // Add your logic to start PiP mode
  }, []);

  const stopPiP = useCallback(() => {
    console.log('Picture-in-Picture stopped');
    // Add your logic to stop PiP mode
  }, []);

  const toggleCam = useCallback(() => {
    setIsCamOn((prev) => !prev);
  }, []);

  const togglePiP = useCallback(() => {
    setIsPiPOn((prev) => !prev);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  return {
    messages,
    setMessages, // Expose setMessages to be used externally
    sendActionToChatbot,
    context,
    isMemEnabled,
    toggleMem,
    isCamOn,
    toggleCam,
    isPiPOn,
    togglePiP,
    isMicOn,
    toggleMic,
    startMic,
    stopMic,
    startCam,
    stopCam,
    startPiP,
    stopPiP,
  };
};
