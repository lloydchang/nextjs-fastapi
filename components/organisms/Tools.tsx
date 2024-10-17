// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react'; // Updated to include useState, useRef, useEffect
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import * as use from '@tensorflow-models/universal-sentence-encoder'; // TensorFlow.js
import '@tensorflow/tfjs-backend-webgl'; // WebGL backend
import '@tensorflow/tfjs-backend-cpu'; // Optional CPU backend fallback
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
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl'); // Attempt to use WebGL backend
        await tf.ready(); // Ensure backend is initialized
        const loadedModel = await use.load();
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading TensorFlow model:', error);
      }
    };
    loadModel();
  }, []);

  // Compute semantic similarity between user message and button paragraphs
  const computeSimilarity = async (message: string) => {
    if (!model) return;

    try {
      const inputEmbedding = await model.embed([message]); // Embed message as array

      const similarities = await Promise.all(
        Object.entries(toolsButtonsParagraphs).map(async ([buttonName, { paragraphs }]) => {
          const paragraphEmbedding = await model.embed(paragraphs); // Embed paragraphs as array
          const similarity = cosineSimilarity(
            inputEmbedding.arraySync()[0],
            paragraphEmbedding.arraySync()[0]
          );
          return { buttonName, similarity };
        })
      );

      const bestMatch = similarities.reduce((prev, curr) =>
        curr.similarity > prev.similarity ? curr : prev
      );

      setHighlightedButton(bestMatch.buttonName);
    } catch (error) {
      console.error('Error computing similarity:', error);
    }
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
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
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
        {highlightedButton && <div className={styles['flashing-arrow']} />}
      </div>
    </div>
  );
};

export default Tools;
