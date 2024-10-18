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
  const [highlightedButtons, setHighlightedButtons] = useState<string[]>([]);

  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const lastNudgeMessageRef = useRef<string | null>(null);

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const escapeRegExp = (string: string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // New function to find multiple matching buttons
  const findMatchingButtons = useCallback(
    (message: string): string[] => {
      const lowerMessage = message.trim().toLowerCase();
      const matchedButtons: string[] = [];

      // Match buttons by name
      const nameMatches = Object.keys(buttonBlurb).filter((buttonName) =>
        buttonName.toLowerCase() === lowerMessage
      );
      matchedButtons.push(...nameMatches);

      // Match buttons by blurb content
      const blurbMatches = Object.entries(buttonBlurb)
        .filter(([_, { blurb }]) =>
          blurb.toLowerCase().includes(lowerMessage)
        )
        .map(([buttonName]) => buttonName);

      // Avoid duplicate matches
      blurbMatches.forEach((button) => {
        if (!matchedButtons.includes(button)) matchedButtons.push(button);
      });

      return matchedButtons.length > 0 ? matchedButtons : [Object.keys(buttonBlurb)[0]];
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
      const matchingButtons = findMatchingButtons(getLatestMessage);
      setHighlightedButtons(matchingButtons);

      const messageText = matchingButtons
        .map((buttonName) => {
          const blurbText = `**${buttonBlurb[buttonName].blurb || ''}**`;
          const url = buttonBlurb[buttonName].url || '';
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">${blurbText}</a>`;
        })
        .join(' ');

      if (lastNudgeMessageRef.current !== messageText) {
        dispatch(
          addMessage({
            id: uuidv4(),
            content: messageText,
            timestamp: Date.now(),
            persona: matchingButtons.join(', '),
            role: 'nudge',
            sender: 'nudge',
            text: messageText,
            hidden: false,
          })
        );
        lastNudgeMessageRef.current = messageText;
      }
    }
  }, [getLatestMessage, dispatch, findMatchingButtons]);

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
                highlightedButtons.includes(buttonName) ? styles['highlight'] : ''
              }`}
              onClick={() => openInNewTab(buttonBlurb[buttonName].url)}
            >
              {buttonName}
            </button>
            {highlightedButtons.includes(buttonName) && (
              <div className={styles['flashing-arrow']} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
