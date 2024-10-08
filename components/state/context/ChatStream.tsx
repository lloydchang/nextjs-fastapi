// File: components/state/context/ChatStream.tsx

import React, { useState, useEffect } from 'react';
import logger from '../../../app/api/chat/utils/logger'; // Adjust the path based on your structure

const ChatStream = () => {
  const [messages, setMessages] = useState<{ persona: string; message: string }[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/route');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        logger.error(`ChatStream - Error received from server: ${data.error}`);
        setIsRunning(false);
        eventSource.close();
        return;
      }

      setMessages((prevMessages) => [...prevMessages, { persona: data.persona, message: data.message }]);
      logger.debug(`ChatStream - New message received from ${data.persona}: ${data.message}`);
    };

    eventSource.onerror = () => {
      logger.error('ChatStream - Error with the event source.');
      setIsRunning(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h2>Continuous Multi-Persona Conversation</h2>
      {messages.map((msg, index) => (
        <div key={index}>
          <strong>{msg.persona}:</strong> {msg.message}
        </div>
      ))}
      {!isRunning && <div><strong>Streaming ended due to an error.</strong></div>}
    </div>
  );
};

export default ChatStream;
