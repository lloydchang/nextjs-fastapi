// components/ChatInput.tsx

import React from 'react';

interface ChatInputProps {
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChat: (input: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chatInput,
  setChatInput,
  handleChat,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChat(chatInput);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default ChatInput;
