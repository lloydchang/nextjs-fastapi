// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react'; // Updated to include useState, useRef, useEffect
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import * as use from '@tensorflow-models/universal-sentence-encoder'; // TensorFlow.js
import toolsButtonsParagraphs from './toolsButtonsParagraphs'; // Import the button-paragraph map
import styles from 'styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  // State and refs for dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  // State to highlight the button based on semantic similarity
  const [highlightedButton, setHighlightedButton] = useState<string | null>(null); 

  // TensorFlow.js model state
  const [model, setModel] = useState<use.UniversalSentenceEncoder | null>(null);

  // Redux selector to get chat messages
  const messages = useSelector((state: RootState) => state.chat.messages);

  // Open URLs in a new tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Load TensorFlow.js Universal Sentence Encoder on component mount
  useEffect(() => {
    use.load().then((loadedModel) => setModel(loadedModel));
  }, []);

  // Compute semantic similarity between user message and button paragraphs
  const computeSimilarity = async (message: string) => {
    if (!model) return;

    const inputEmbedding = await model.embed(message);
    let bestMatch: string | null = null;
    let highestSimilarity = 0;

    for (const [buttonName, { paragraphs }] of Object.entries(toolsButtonsParagraphs)) {
      const paragraphEmbedding = await model.embed(paragraphs);
      const similarity = cosineSimilarity(
        inputEmbedding.arraySync()[0], // Convert tensors to arrays
        paragraphEmbedding.arraySync()[0]
      );

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = buttonName;
      }
    }

    setHighlightedButton(bestMatch); // Set the matching button as highlighted
  };

  // Monitor chat messages and trigger similarity computation
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1].text;
      computeSimilarity(latestMessage);
    }
  }, [messages, model]);

  // Cosine similarity function
  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  // Mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragItem.current = e.currentTarget as HTMLDivElement;
    dragStartPosition.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  // Mouse move event to handle the drag movement
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPosition.current.x,
        y: e.clientY - dragStartPosition.current.y,
      });
    }
  };

  // Mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // useEffect to add and remove drag event listeners
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
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }} // Positioning applied via inline styles
      onMouseDown={handleMouseDown} // Attach mouse down event to initiate drag
    >
      <div className={styles['button-group']}>
        {Object.keys(toolsButtonsParagraphs).map((buttonName) => (
          <button
            key={buttonName}
            className={`${styles['right-edge-button']} ${
              highlightedButton === buttonName ? styles['highlight'] : ''
            }`}
            onClick={() => openInNewTab(toolsButtonsParagraphs[buttonName].url)}
          >
            {buttonName}
          </button>
        ))}
        {highlightedButton && <div className={styles['flashing-arrow']} />} {/* Flashing arrow */}
      </div>
    </div>
  );
};

export default Tools;
