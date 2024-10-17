// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { sendMessage } from 'store/chatSlice'; // Import sendMessage action
import toolsButtonsParagraphs from './toolsButtonsParagraphs'; // Import the button-paragraph map
import styles from 'styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [highlightedButton, setHighlightedButton] = useState<string>(
    Object.keys(toolsButtonsParagraphs)[0] // Default to the first button
  );

  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Function to find the matching button, prioritizing button names
  const findMatchingButton = (message: string): string => {
    message = message.toLowerCase(); // Normalize to lowercase for case-insensitive matching

    // 1. Check if any button name matches the message
    const matchingButtonName = Object.keys(toolsButtonsParagraphs).find((buttonName) =>
      message.includes(buttonName.toLowerCase())
    );

    if (matchingButtonName) {
      return matchingButtonName; // Return the button name if found
    }

    // 2. If no button name matches, search in the paragraph text
    for (const [buttonName, { paragraph }] of Object.entries(toolsButtonsParagraphs)) {
      if (paragraph.toLowerCase().includes(message)) {
        return buttonName; // Return the button name if the paragraph matches
      }
    }

    // 3. Default to the first button if no match is found
    return Object.keys(toolsButtonsParagraphs)[0];
  };

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1].text;
      const matchingButton = findMatchingButton(latestMessage);

      if (matchingButton !== highlightedButton) {
        console.debug(`Matching button found: ${matchingButton}`);
        setHighlightedButton(matchingButton);

        // Combine button name, paragraph, and URL into a single message text
        const paragraphToSend = `${toolsButtonsParagraphs[matchingButton].paragraph || ''} `;

        const messageText = paragraphToSend;

        dispatch(
          sendMessage({
            text: messageText,
            sender: 'user',
            hidden: true,
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
