import React, { useState, useEffect, MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer';
import { Message } from 'types';

// New: Add a prop for Info mode detection
interface ChatMessageProps extends Message {
  isInfo: boolean;
}

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

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim, persona, isInfo }) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const isUser = sender.toLowerCase() === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

  const shouldShorten = sender === 'bot' && text.split(' ').length > 10;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;

  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';

  const handleOpenModal = () => {
    if (!isUser) {
      setShowFullScreen(true);
    }
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
      {/* Full-Screen Modal - Only for bot messages */}
      {showFullScreen && !isUser && (
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
        onMouseEnter={() => !isUser && setShowFullMessage(true)}
        onMouseLeave={() => !isUser && setShowFullMessage(false)}
        onClick={handleOpenModal}
        style={{ position: 'relative' }} // Ensure the parent is relative
      >
        {/* Display Persona Label for bot messages only */}
        {sender === 'bot' && persona && (
          <div className={`${showFullMessage ? styles.personaLabelHovered : styles.personaLabel}`} style={{ color: personaColor }}>
            <strong>{persona}</strong>
          </div>
        )}
        {/* Hovered text will be shown below the persona label */}
        {showFullMessage && !isUser && (
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
        {/* Shortened text for non-hover state */}
        {!showFullMessage && (
          <div className={styles.text}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: ({ node, ...props }) => <LinkRenderer {...props} />,
              }}
            >
              {shortenedText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
