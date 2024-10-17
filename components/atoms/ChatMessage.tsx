// File: components/atoms/ChatMessage.tsx

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer';
import { Message } from 'types';

interface ChatMessageProps extends Message {
  isFullScreen: boolean;
}

const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(www\.[\w.-]+\.[\w]{2,}|[\w.-]+\.[\w]{2,})(\/\S*)?(?!\S)/g;
  return text.replace(urlPattern, (match) => `[${match}](http://${match})`);
};

const hashPersonaToColor = (persona: string): string => {
  let hash = 0;
  for (let i = 0; i < persona.length; i++) {
    hash = persona.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorValue = 0x777777 + (Math.abs(hash) % (0xffffff - 0x777777));
  return `#${colorValue.toString(16).padStart(6, '0')}`;
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
  
  const processedText = convertPlainUrlsToMarkdownLinks(text);
  const shortenedText = 
    text.split(' ').length > 10 && !isFullScreen
      ? `${text.split(' ').slice(0, 10).join(' ')}…`
      : text;

  const isUser = sender === 'user';
  const isAd = role === 'ad';

  const handleOpenModal = () => setShowFullScreen(true);
  const handleCloseModal = () => setShowFullScreen(false);

  useEffect(() => {
    if (showFullScreen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleCloseModal();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showFullScreen]);

  return (
    <>
      {showFullScreen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.fullScreenMessage} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {displayPersona && (
                <div className={styles.modalPersonaLabel} style={{ color: personaColor }}>
                  <strong>{displayPersona}</strong>
                </div>
              )}
              <button className={styles.modalCloseButton} onClick={handleCloseModal}>
                Close
              </button>
            </div>
            <div className={`${styles.text} ${isAd ? styles.adContent : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{ a: ({ node, ...props }) => <LinkRenderer {...props} /> }}
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
        } ${isInterim ? styles.interim : ''} ${isAd ? styles.adMessage : ''}`}
        onClick={handleOpenModal}
        style={{ position: 'relative' }}
      >
        {displayPersona && (
          <div
            className={`${styles.personaLabel} ${
              showFullScreen ? styles.personaLabelHovered : ''
            }`}
            style={{ color: personaColor }}
          >
            <strong>{displayPersona}</strong>
          </div>
        )}

        <div className={`${styles.text} ${isAd ? styles.adContent : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{ a: ({ node, ...props }) => <LinkRenderer {...props} /> }}
          >
            {shortenedText}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
