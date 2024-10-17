// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { addMessage } from 'store/chatSlice';
import toolsButtonsParagraphs from './toolsButtonsParagraphs';
import styles from 'styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [highlightedButton, setHighlightedButton] = useState<string>(
    Object.keys(toolsButtonsParagraphs)[0]
  );

  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const findMatchingButton = (message: string): string => {
    message = message.toLowerCase();

    const matchingButtonName = Object.keys(toolsButtonsParagraphs).find((buttonName) =>
      message.includes(buttonName.toLowerCase())
    );

    if (matchingButtonName) {
      return matchingButtonName;
    }

    for (const [buttonName, { paragraph }] of Object.entries(toolsButtonsParagraphs)) {
      if (paragraph.toLowerCase().includes(message)) {
        return buttonName;
      }
    }

    return Object.keys(toolsButtonsParagraphs)[0];
  };

  const getLatestMessage = () => {
    const botMessages = messages.filter((msg) => msg.sender === 'bot');
    const userMessages = messages.filter((msg) => msg.sender === 'user');

    const latestBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1].text : '';
    const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : '';

    return latestUserMessage || latestBotMessage;
  };

  useEffect(() => {
    const latestMessage = getLatestMessage(); // Get the latest user or bot message

    if (latestMessage) {
      const matchingButton = findMatchingButton(latestMessage);

      if (matchingButton !== highlightedButton) {
        console.debug(`Matching button found: ${matchingButton}`);
        setHighlightedButton(matchingButton);

        const buttonToSend = `***${matchingButton || ''}***: `;
        const paragraphToSend = `${toolsButtonsParagraphs[matchingButton].paragraph || ''} `;
        const urlToSend = `${toolsButtonsParagraphs[matchingButton].url || ''}`;

        const messageText = buttonToSend + paragraphToSend + urlToSend;

        dispatch(
          addMessage({
            persona: 'Ad',
            sender: 'ad',
            text: messageText,
            hidden: false,
          })
        );
      }
    }
  }, [messages, dispatch, highlightedButton]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragItem.current = e.currentTarget as HTMLDivElement;
    dragStartPosition.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStartPosition.current.x,
        y: e.clientY - dragStartPosition.current.y,
      };
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className={styles['tools-container']}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <div className={styles['button-group']}>
        {Object.keys(toolsButtonsParagraphs).map((buttonName) => (
          <div key={buttonName} className={styles['lazy-arrow-container']}>
            <button
              className={`${styles['right-edge-button']} ${
                highlightedButton === buttonName ? styles['highlight'] : ''
              }`}
              onClick={() => openInNewTab(toolsButtonsParagraphs[buttonName].url)}
            >
              {buttonName}
            </button>
            {highlightedButton === buttonName && (
              <div className={styles['flashing-arrow']} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
