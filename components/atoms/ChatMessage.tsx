// File: components/atoms/ChatMessage.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer';

interface ChatMessageProps {
  sender: string;
  text: string;
  isInterim?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim }) => {
  const isUser = sender.toLowerCase() === 'user';

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : styles.botMessage
      } ${isInterim ? styles.interim : ''}`}
    >
      <div className={styles.text}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ node, ...props }) => <LinkRenderer {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
