// File: components/atoms/ChatMessage.tsx

import React, { useEffect, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import { Message } from 'types';
import { useModal } from '../state/context/ModalContext';

// Custom Link Renderer to ensure links open safely in a new tab
const LinkRenderer = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);

// Custom schema to allow specific attributes and tag names
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    iframe: ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'iframe'],
};

// Props interface extending Message with additional flags
interface ChatMessageProps extends Message {
  isFullScreen: boolean;
}

const palette = [
  '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728',
  '#9467BD', '#8C564B', '#E377C2', '#7F7F7F',
  '#BCBD22', '#17BECF',
];

// Function to consistently hash persona names to colors
const hashPersonaToColor = (persona: string): string => {
  let hash = 0;
  for (let i = 0; i < persona.length; i++) {
    hash = persona.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

// Function to convert plain URLs in text to Markdown links
const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(https?:\/\/[\w.-]+\.[\w]{2,}|www\.[\w.-]+\.[\w]{2,})(\/\S*)?(?!\S)/g;
  return text.replace(urlPattern, (match) => {
    const url = match.startsWith('www.') ? `http://${match}` : match;
    return `[${match}](${url})`;
  });
};

// Function to render persona labels with Markdown support
const renderPersonaLabel = (persona: string, personaColor: string) => (
  <div className={styles.modalPersonaLabel} style={{ color: personaColor, fontWeight: 'bold' }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{persona}</ReactMarkdown>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  text,
  isInterim,
  persona,
  isFullScreen,
  role,
}) => {
  const { openModal, closeModal, activeModal } = useModal();
  const [showFullMessage, setShowFullMessage] = useState(false);

  const displayPersona = persona || sender;
  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';
  const isUser = role === 'user';

  const processedText = convertPlainUrlsToMarkdownLinks(text);

  // Updated shortening logic to exclude user messages
  const shouldShorten = text.split(' ').length > 10 && !isFullScreen && !isUser;
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text;

  const modalId = `modal-${text}`;
  const isModalOpen = activeModal === modalId;

  // Updated handleOpenModal to prevent opening modal for user messages
  const handleOpenModal = useCallback(() => {
    if (!isFullScreen && !isUser) { // Prevent modal for user messages
      openModal(modalId);
      console.debug('Opening modal for message:', { text, sender, role });
    }
  }, [isFullScreen, isUser, modalId, openModal, text, sender, role]);

  // Markdown renderer with plugins and custom link handling
  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw, [rehypeSanitize, customSchema]]}
      components={{ a: LinkRenderer }}
    >
      {content}
    </ReactMarkdown>
  );

  // Effect to handle Escape key for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, closeModal]);

  // Handle key presses for accessibility (Enter and Space)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isFullScreen && !isUser) {
      handleOpenModal();
    }
  };

  return (
    <>
      {/* Conditional Rendering: Modal is not rendered for user messages or in full-screen mode */}
      {!isUser && !isFullScreen && isModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${modalId}`}
          id={modalId}
          tabIndex={-1}
        >
          <div
            className={styles.modalMessage}
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className={styles.modalHeader}>
              {persona && renderPersonaLabel(persona, personaColor)}
              <button
                className={styles.modalCloseButton}
                onClick={closeModal}
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
            <div className={styles.text}>{renderMarkdown(processedText)}</div>
          </div>
        </div>
      )}

      <div
        className={`${styles.messageContainer} ${
          isUser ? styles.userMessage : styles.botMessage
        } ${isInterim ? styles.interim : ''}`}
        onMouseEnter={() => !isFullScreen && !isUser && setShowFullMessage(true)} // Disable hover for user messages
        onMouseLeave={() => !isFullScreen && !isUser && setShowFullMessage(false)} // Disable hover for user messages
        onClick={handleOpenModal} // Handle click only if not in full-screen and not user
        role="button"
        tabIndex={0}
        onKeyPress={handleKeyPress} // Handle key press only if not in full-screen and not user
        aria-expanded={isModalOpen}
      >
        {persona && (
          <div
            className={`${
              showFullMessage ? styles.personaLabelHovered : styles.personaLabel
            }`}
            style={{ color: personaColor }}
          >
            {renderPersonaLabel(persona, personaColor)}
          </div>
        )}
        {/* Conditionally render the hovered text only if not in full-screen and not user */}
        {!isFullScreen && !isUser && showFullMessage && (
          <div className={styles.textHovered}>
            {renderMarkdown(processedText)}
          </div>
        )}
        <div className={styles.text}>
          {renderMarkdown(shouldShorten ? shortenedText : processedText)}
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
