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
import { useModal } from '../state/context/ModalContext'; // Import useModal

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
  tagNames: [...(defaultSchema.tagNames ?? []), 'iframe'], // Ensure tagNames is iterable
};

interface ChatMessageProps extends Message {
  isFullScreen: boolean;
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

const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  text,
  isInterim,
  persona,
  isFullScreen,
  role,
}) => {
  const { openModal, closeModal, activeModal } = useModal(); // Use modal context
  const [showFullMessage, setShowFullMessage] = useState(false); // Control hover display

  const displayPersona = persona || sender; // Use sender if persona is missing
  const personaColor = persona ? hashPersonaToColor(persona) : '#777777'; // Generate persona color
  const isUser = role === 'user'; // Determine if message is from the user

  const processedText = convertPlainUrlsToMarkdownLinks(text); // Process links in text
  const shouldShorten = text.split(' ').length > 10 && !isFullScreen; // Check if text should be shortened
  const shortenedText = shouldShorten ? `${text.split(' ').slice(0, 10).join(' ')}…` : text; // Shorten text if needed

  const modalId = `modal-${text}`; // Unique ID for each message modal
  const isModalOpen = activeModal === modalId; // Check if this modal is open

  // Open modal when the message is clicked
  const handleOpenModal = useCallback(() => {
    openModal(modalId); // Open this modal via context
    console.debug('Opening modal for message:', text);
  }, [modalId, openModal, text]);

  // Render markdown with plugins
  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeRaw, [rehypeSanitize, customSchema]]}
      components={{ a: LinkRenderer }}
    >
      {content}
    </ReactMarkdown>
  );

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal(); // Close on Escape
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, closeModal]);

  // Handle keyboard interactions (Enter/Space to open modal)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleOpenModal(); // Open modal on Enter or Space
    }
  };

  return (
    <>
      {isModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          id="chat-message-modal"
          tabIndex={-1}
        >
          <div
            className={styles.fullScreenMessage}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            role="document"
          >
            <div className={styles.modalHeader}>
              {persona && (
                <div
                  className={styles.modalPersonaLabel}
                  style={{ color: personaColor }}
                >
                  <strong id="modal-title">{persona}</strong>
                </div>
              )}
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
        onMouseEnter={() => !isFullScreen && setShowFullMessage(true)}
        onMouseLeave={() => setShowFullMessage(false)}
        onClick={handleOpenModal}
        style={{ position: 'relative' }}
        role="button"
        tabIndex={0}
        onKeyPress={handleKeyPress}
        aria-expanded={isModalOpen}
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
