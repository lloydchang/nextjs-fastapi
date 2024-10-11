// File: components/atoms/ChatMessage.tsx

import React, { useState, useEffect, MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer';
import { Message } from 'types';

const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/\S*)?(?!\S)/g;
  return text.replace(urlPattern, (match) => {
    const url = match.startsWith('www.') ? `http://${match}` : `http://${match}`;
    return `[${match}](${url})`;
  });
};

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

const ChatMessage: React.FC<Message> = ({ sender, text, isInterim, persona }) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const isUser = sender.toLowerCase() === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

  const shouldShorten = sender === 'bot' && text.split(' ').length > 10;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;

  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';

  const handleOpenModal = () => {
    setShowFullScreen(true);
  };

  const handleCloseModal = () => {
    setShowFullScreen(false);
  };

  // Handle Escape key press to close the modal
  useEffect(() => {
    if (showFullScreen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleCloseModal();
        }
      };

      // Attach event listener
      document.addEventListener('keydown', handleKeyDown);

      // Clean up event listener on unmount or modal close
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showFullScreen]); // Re-run effect only when `showFullScreen` changes

  return (
    <>
      {/* Full-Screen Modal */}
      {showFullScreen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.fullScreenMessage} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Persona Label and Close Button */}
            <div className={styles.modalHeader}>
              {/* Persona Label */}
              {sender === 'bot' && persona && (
                <div className={styles.modalPersonaLabel} style={{ color: personaColor }}>
                  <strong>{persona}</strong>
                </div>
              )}
              {/* Close Button */}
              <button className={styles.modalCloseButton} onClick={handleCloseModal}>
                Close
              </button>
            </div>
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
      )}

      <div
        className={`${styles.messageContainer} ${
          isUser ? styles.userMessage : styles.botMessage
        } ${isInterim ? styles.interim : ''}`}
        onMouseEnter={() => setShowFullMessage(true)}
        onMouseLeave={() => setShowFullMessage(false)}
        onClick={handleOpenModal}
      >
        {/* Display Persona Label for bot messages only */}
        {sender === 'bot' && persona && (
          <div className={styles.personaLabel} style={{ color: personaColor }}>
            <strong>{persona}</strong>
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
