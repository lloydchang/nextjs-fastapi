// File: components/atoms/ChatMessage.tsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Ensure the correct styling for code highlighting
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer'; // Ensure this path is correct
import { Message } from 'types'; // Import the unified Message type

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
  const rangeValue = minColorValue + (Math.abs(hash) % (maxColorValue - minColorValue));
  return `#${rangeValue.toString(16)}`;
};

// Update the component to use the Message type directly for props
const ChatMessage: React.FC<Message> = ({ sender, text, isInterim, persona }) => {
  const [showFullMessage, setShowFullMessage] = useState(false); // State to control full message display
  const [showFullScreen, setShowFullScreen] = useState(false); // State to control full-screen modal display
  const isUser = sender.toLowerCase() === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

  // Shorten text if necessary
  const shouldShorten = sender === 'bot' && text.split(' ').length > 10;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;

  const personaColor = persona ? hashPersonaToColor(persona) : '#777777'; // Default color if persona is undefined

  return (
    <>
      {/* Full-Screen Modal */}
      {showFullScreen && (
        <div className={styles.modalBackdrop} onClick={() => setShowFullScreen(false)}>
          <div className={styles.fullScreenMessage} onClick={(e) => e.stopPropagation()}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: ({ node, ...props }) => <LinkRenderer {...props} />,
              }}
            >
              {processedText}
            </ReactMarkdown>
            <button className={styles.closeButton} onClick={() => setShowFullScreen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div
        className={`${styles.messageContainer} ${
          isUser ? styles.userMessage : styles.botMessage
        } ${isInterim ? styles.interim : ''}`}
        onMouseEnter={() => setShowFullMessage(true)} // Show full message on hover
        onMouseLeave={() => setShowFullMessage(false)} // Hide full message on leave
        onClick={() => setShowFullScreen(true)} // Toggle full-screen modal on click
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
            {showFullMessage ? processedText : shortenedText}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
