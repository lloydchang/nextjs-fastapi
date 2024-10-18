// File: components/atoms/ChatMessage.tsx

import React, { useEffect, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw'; // Reintroduced for rendering raw HTML
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'; // Added for sanitization
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import { Message } from 'types';
import { useModal } from '../state/context/ModalContext';

// Inline anchor renderer with correct typing
const LinkRenderer = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);

// Safely handling tagNames with nullish coalescing operator
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    iframe: ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'iframe'],
};

interface ChatMessageProps extends Message {
  isFullScreen: boolean;
  isLastMessage: boolean; // Added prop to indicate if this is the last message
}

const palette = [
  '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728',
  '#9467BD', '#8C564B', '#E377C2', '#7F7F7F',
  '#BCBD22', '#17BECF',
];

// Generate a color for a persona based on its name
const hashPersonaToColor = (persona: string): string => {
  let hash = 0;
  for (let i = 0; i < persona.length; i++) {
    hash = persona.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

// Convert plain URLs into clickable Markdown links
const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(https?:\/\/[\w.-]+\.[\w]{2,}|www\.[\w.-]+\.[\w]{2,})(\/\S*)?(?!\S)/g;
  return text.replace(urlPattern, (match) => {
    const url = match.startsWith('www.') ? `http://${match}` : match;
    return `[${match}](${url})`;
  });
};

// Render persona with Markdown support
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
  isLastMessage, // Destructure the new prop
}) => {
  const { openModal, closeModal, activeModal } = useModal();
  const [showFullMessage, setShowFullMessage] = useState(false);

  const displayPersona = persona || sender;
  const personaColor = persona ? hashPersonaToColor(persona) : '#777777';
  const isUser = role === 'user';

  const processedText = convertPlainUrlsToMarkdownLinks(text);

  // Updated shortening logic to exclude the last message
  const shouldShorten = text.split(' ').length > 10 && !isFullScreen && !isLastMessage;

  const shortenedText = shouldShorten
    ? `${text.split(' ').slice(0, 10).join(' ')}…`
    : text;

  const modalId = `modal-${text}`;
  const isModalOpen = activeModal === modalId;

  // Updated handleOpenModal to prevent opening modal in full-screen mode
  const handleOpenModal = useCallback(() => {
    if (!isFullScreen) { // Prevent modal opening when in full-screen
      openModal(modalId);
      console.debug('Opening modal for message:', { text, sender, role });
    }
  }, [isFullScreen, modalId, openModal, text, sender, role]);

  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw, [rehypeSanitize, customSchema]]}
      components={{ a: LinkRenderer }}
    >
      {content}
    </ReactMarkdown>
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, closeModal]);

  // Updated handleKeyPress to prevent modal opening via keyboard in full-screen mode
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isFullScreen) {
      handleOpenModal();
    }
  };

  return (
    <>
      {/* Conditional Rendering: Modal is not rendered in full-screen mode */}
      {!isFullScreen && isModalOpen && (
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
        onMouseEnter={() => !isFullScreen && setShowFullMessage(true)} // Prevent hover effect in full-screen
        onMouseLeave={() => !isFullScreen && setShowFullMessage(false)} // Prevent hover effect in full-screen
        onClick={handleOpenModal} // Handle click only if not in full-screen
        role="button"
        tabIndex={0}
        onKeyPress={handleKeyPress} // Handle key press only if not in full-screen
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
        {/* Conditionally render the hovered text only if not in full-screen */}
        {!isFullScreen && showFullMessage && (
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
