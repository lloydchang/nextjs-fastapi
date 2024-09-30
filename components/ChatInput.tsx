// components/ChatInput.tsx
import React from "react";
import styles from "./ChatInput.module.css"; // Import CSS module for styling

interface ChatInputProps {
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChat: (input: string) => void; // Updated to accept a string parameter
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  const isDisabled = chatInput.trim() === "";

  // Function to handle sending the message and clearing the input
  const sendMessage = () => {
    if (chatInput.trim()) {
      handleChat(chatInput); // Pass the chatInput value to handleChat
      setChatInput(''); // Clear the input field after sending
    }
  };

  return (
    <div className={styles.container}>
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent adding a new line
            sendMessage(); // Call the function to send the message
          }
        }}
        placeholder="Type your message..."
        className={styles.textarea}
        rows={3} // Adjust rows as needed
      />
      <button
        onClick={sendMessage} // Use the sendMessage function
        disabled={isDisabled}
        className={`${styles.button} ${isDisabled ? styles.buttonDisabled : ""}`}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
