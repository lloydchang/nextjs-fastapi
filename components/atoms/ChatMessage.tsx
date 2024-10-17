// File: components/atoms/ChatMessage.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
    const url = match.startsWith('www.') ? `http://${match}` : match;
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

const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  text,
  isInterim,
  persona,
  isFullScreen,
  role,
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);

  const displayPersona = persona || sender;
  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';

  const isUser = role === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);
  const shouldShorten = sender === 'bot' && text.split(' ').length > 10 && !isFullScreen;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;

  const handleOpenModal = useCallback(() => {
    setShowFullScreen(true);
    console.debug('Opening full screen for message:', text);
  }, [text]);

  const handleCloseModal = useCallback(() => {
    setShowFullScreen(false);
    console.debug('Closing full screen modal');
  }, []);

  useEffect(() => {
    if (showFullScreen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleCloseModal();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showFullScreen, handleCloseModal]);

  return (
    <>
      {showFullScreen && (
        <div
          className={styles.modalBackdrop}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.fullScreenMessage}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              {persona && (
                <div
                  className={styles.modalPersonaLabel}
                  style={{ color: personaColor }}
                >
                  <strong>{persona}</strong>
                </div>
              )}
              <button
                className={styles.modalCloseButton}
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>

            <div className={styles.text}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{ a: LinkRenderer }}
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
        onMouseEnter={() => !isFullScreen && setShowFullMessage(true)}
        onMouseLeave={() => setShowFullMessage(false)}
        onClick={handleOpenModal}
        style={{ position: 'relative' }}
      >
        {persona && (
          <div
            className={`${
              showFullMessage ? styles.personaLabelHovered : styles.personaLabel
            }`}
            style={{ color: personaColor }}
          >
            <strong>{persona}</strong>
          </div>
        )}
        {!isFullScreen && showFullMessage && (
          <div className={styles.textHovered}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{ a: LinkRenderer }}
            >
              {processedText}
            </ReactMarkdown>
          </div>
        )}
        <div className={styles.text}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{ a: LinkRenderer }}
          >
            {shouldShorten ? shortenedText : processedText}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
