// File: components/atoms/ChatMessage.tsx

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw'; // For rendering raw HTML
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer';
import { Message } from 'types';

// Add a prop for Full Screen mode detection
interface ChatMessageProps extends Message {
  isFullScreen: boolean;
}

const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(https?:\/\/[\w.-]+\.[\w]{2,}|www\.[\w.-]+\.[\w]{2,})(\/\S*)?(?!\S)/g;
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
  return `#${rangeValue.toString(16).padStart(6, '0')}`; // Ensure it's 6 characters
};

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim, persona, isFullScreen, role }) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false); // Retained for non-full-screen mode

  const displayPersona = persona || sender;
  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';

  const isUser = role === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

  // Update shortening logic to consider isFullScreen
  const shouldShorten = sender === 'bot' && text.split(' ').length > 10 && !isFullScreen;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;


  const handleOpenModal = () => {
    setShowFullScreen(true);
    console.debug('Opening full screen for message:', text);
  };

  const handleCloseModal = () => {
    setShowFullScreen(false);
    console.debug('Closing full screen modal');
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
              {persona && (
                <div className={styles.modalPersonaLabel} style={{ color: personaColor }}>
                  <strong>{persona}</strong>
                </div>
              )}
              {/* Close Button */}
              <button className={styles.modalCloseButton} onClick={handleCloseModal}>
                Close
              </button>
            </div>

            {/* Apply the same .text class inside the modal to ensure markdown styles are inherited */}
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
        </div>
      )}

      <div
        className={`${styles.messageContainer} ${
          isUser ? styles.userMessage : styles.botMessage
        } ${isInterim ? styles.interim : ''}`}
        onMouseEnter={() => !isFullScreen && setShowFullMessage(true)} // Retained for non-full-screen mode
        onMouseLeave={() => isFullScreen && setShowFullMessage(false)} // Retained for non-full-screen mode
        onClick={handleOpenModal}
        style={{ position: 'relative' }} // Ensure the parent is relative
      >
        {/* Display Persona Label */}
        {persona && (
          <div className={`${showFullMessage ? styles.personaLabelHovered : styles.personaLabel}`} style={{ color: personaColor }}>
            <strong>{persona}</strong>
          </div>
        )}
        {/* Hovered text will be shown below the persona label */}
        {!isFullScreen && showFullMessage && (
          <div className={styles.textHovered}>
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
        )}
        {/* Shortened or Full text based on mode */}
        <div className={styles.text}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              a: ({ node, ...props }) => <LinkRenderer {...props} />,
            }}
          >
            {shouldShorten ? shortenedText : processedText}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
