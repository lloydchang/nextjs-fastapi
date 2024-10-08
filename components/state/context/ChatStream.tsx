// File: components/state/context/ChatStream.tsx

import React, { useState, useEffect } from 'react';

const ChatStream = () => {
  const [messages, setMessages] = useState<{ persona: string; message: string }[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource('/api/chat/route');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        console.error(data.error);
        setIsRunning(false);
        eventSource.close();
        return;
      }

      setMessages((prevMessages) => [...prevMessages, { persona: data.persona, message: data.message }]);
    };

    eventSource.onerror = () => {
      console.error('Error with the event source.');
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
