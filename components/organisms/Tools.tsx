// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { addMessage } from 'store/chatSlice';
import buttonBlurb from 'components/organisms/buttonBlurb';
import styles from 'styles/components/organisms/Tools.module.css';
import { v4 as uuidv4 } from 'uuid'; // Import uuid to generate unique ids

const Tools: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [highlightedButton, setHighlightedButton] = useState<string>(
    Object.keys(buttonBlurb)[0]
  );

  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const lastNudgeMessageRef = useRef<string | null>(null);

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const escapeRegExp = (string: string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findMatchingButton = useCallback(
    (message: string): string => {
      const lowerMessage = message.toLowerCase();

      const matchingButtonName = Object.keys(buttonBlurb).find((buttonName) => {
        const regex = new RegExp(`\\b${escapeRegExp(buttonName.toLowerCase())}\\b`, 'i');
        return regex.test(lowerMessage);
      });

      if (matchingButtonName) return matchingButtonName;

      for (const [buttonName, { blurb }] of Object.entries(buttonBlurb)) {
        const regex = new RegExp(`\\b${escapeRegExp(lowerMessage)}\\b`, 'i');
        if (regex.test(blurb.toLowerCase())) return buttonName;
      }

      return Object.keys(buttonBlurb)[0];
    },
    []
  );

  const getLatestMessage = useMemo(() => {
    const botMessages = messages.filter((msg) => msg.sender === 'bot');
    const userMessages = messages.filter((msg) => msg.sender === 'user');

    const latestBotMessage = botMessages.at(-1)?.text || '';
    const latestUserMessage = userMessages.at(-1)?.text || '';

    return latestUserMessage || latestBotMessage;
  }, [messages]);

  useEffect(() => {
    if (getLatestMessage) {
      const matchingButton = findMatchingButton(getLatestMessage);

      if (matchingButton !== highlightedButton) {
        console.debug(`Matching button found: ${matchingButton}`);
        setHighlightedButton(matchingButton);

        const buttonText = `***${matchingButton || ''}?***`;
        const blurbText = `**${buttonBlurb[matchingButton].blurb || ''}**`;
        const url = buttonBlurb[matchingButton].url || '';

        const messageText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${blurbText}</a>`;

        if (lastNudgeMessageRef.current !== messageText) {
          dispatch(
            addMessage({
              id: uuidv4(),
              content: messageText,
              timestamp: Date.now(),
              persona: buttonText,
              role: 'nudge',
              sender: 'nudge',
              text: messageText,
              hidden: false,
            })
          );
          lastNudgeMessageRef.current = messageText;
        }
      }
    }
  }, [getLatestMessage, dispatch, highlightedButton, findMatchingButton]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragItem.current = e.currentTarget as HTMLDivElement;
      dragStartPosition.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStartPosition.current.x,
          y: e.clientY - dragStartPosition.current.y,
        };
        setPosition(newPosition);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={styles['tools-container']}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <div className={styles['button-group']}>
        {Object.keys(buttonBlurb).map((buttonName) => (
          <div key={buttonName} className={styles['lazy-arrow-container']}>
            <button
              className={`${styles['right-edge-button']} ${
                highlightedButton === buttonName ? styles['highlight'] : ''
              }`}
              onClick={() => openInNewTab(buttonBlurb[buttonName].url)}
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
