// File: components/atoms/ChatMessage.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Ensure the correct styling for code highlighting
import styles from 'styles/components/atoms/ChatMessage.module.css';
import LinkRenderer from 'components/atoms/LinkRenderer'; // Ensure this path is correct

interface ChatMessageProps {
  sender: 'user' | 'bot'; // Specify sender type to ensure it's either 'user' or 'bot'
  text: string;
  isInterim?: boolean;
}

// Function to convert plain URLs into clickable links
const convertPlainUrlsToMarkdownLinks = (text: string) => {
  const urlPattern = /(?<!\S)(www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/\S*)?(?!\S)/g;

  return text.replace(urlPattern, (match) => {
    const url = match.startsWith('www.') ? `http://${match}` : `http://${match}`;
    return `[${match}](${url})`;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim }) => {
  const isUser = sender.toLowerCase() === 'user';
  const processedText = convertPlainUrlsToMarkdownLinks(text);

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
          {processedText}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
