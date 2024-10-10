// File: components/atoms/ChatMessage.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Ensure the correct styling for code highlighting
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer'; // Ensure this path is correct

interface ChatMessageProps {
  sender: 'user' | 'bot'; // Specify sender type to ensure it's either 'user' or 'bot'
  text: string;
  isInterim?: boolean;
  persona?: string; // Add persona property to differentiate bot personas
}

// Function to convert plain URLs into clickable links
const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/\S*)?(?!\S)/g;

  return text.replace(urlPattern, (match) => {
    const url = match.startsWith('www.') ? `http://${match}` : `http://${match}`;
    return `[${match}](${url})`;
  });
};

// Function to hash a persona name to a specific color in the range of #777777 to #FFFFFF
const hashPersonaToColor = (persona: string): string => {
  let hash = 0;
  for (let i = 0; i < persona.length; i++) {
    hash = persona.charCodeAt(i) + ((hash << 5) - hash);
  }
  const minColorValue = parseInt('777777', 16);
  const maxColorValue = parseInt('FFFFFF', 16);

  // Convert hash to a value between the specified color range
  const rangeValue = minColorValue + (Math.abs(hash) % (maxColorValue - minColorValue));
  return `#${rangeValue.toString(16)}`;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim, persona }) => {
  const isUser = sender.toLowerCase() === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

  const personaColor = persona ? hashPersonaToColor(persona) : '#777777'; // Default color if persona is undefined

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : styles.botMessage
      } ${isInterim ? styles.interim : ''}`}
    >
      {/* Display Persona Label for bot messages only */}
      {sender === 'bot' && persona && (
        <div className={styles.personaLabel} style={{ color: personaColor }}>
          <strong>{persona}</strong> {/* Render persona name in bold */}
        </div>
      )}
      <div className={styles.text}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ node, ...props }) => <LinkRenderer {...props} />,
          }}
        >
          {processedText}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
