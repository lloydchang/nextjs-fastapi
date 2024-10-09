// File: src/components/atoms/ChatMessage.tsx

import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import remarkGfm from 'remark-gfm'; // Import remark-gfm for GFM support
import rehypeHighlight from 'rehype-highlight'; // Import rehype-highlight for syntax highlighting
import 'highlight.js/styles/github-dark.css'; // Import Highlight.js dark theme
import styles from '../../styles/components/atoms/ChatMessage.module.css'; // Correct CSS path
import { AnchorHTMLAttributes, Ref } from 'react';

interface ChatMessageProps {
  sender: string;
  text: string;
  isInterim?: boolean;
}

// Define the LinkRenderer using React.forwardRef
const LinkRenderer = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ href, children, ...rest }, ref: Ref<HTMLAnchorElement>) => {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" ref={ref} {...rest}>
        {children}
      </a>
    );
  }
);

LinkRenderer.displayName = 'LinkRenderer'; // Good practice when using forwardRef

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim }) => {
  const isUser = sender.toLowerCase() === 'user';

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : styles.botMessage
      } ${isInterim ? styles.interim : ''}`}
    >
      <div className={styles.text}>
        {/* Render Markdown with GFM and syntax highlighting */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: LinkRenderer, // Use custom link renderer
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
