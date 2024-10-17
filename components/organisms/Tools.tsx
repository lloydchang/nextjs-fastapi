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
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  const [highlightedButton, setHighlightedButton] = useState<string | null>(null);
  const [model, setModel] = useState<use.UniversalSentenceEncoder | null>(null);

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    console.debug(`Opening URL: ${url}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.debug('Loading TensorFlow model...');
        await tf.setBackend('webgl');
        await tf.ready();
        const loadedModel = await use.load();
        setModel(loadedModel);
        console.debug('Model loaded successfully');
      } catch (error) {
        console.error('Error loading TensorFlow model:', error);
      }
    };
    loadModel();
  }, []);

  const computeSimilarity = async (message: string) => {
    if (!model) {
      console.warn('Model is not loaded yet');
      return;
    }

    console.debug(`Computing similarity for message: "${message}"`);
    try {
      const inputEmbedding = await model.embed([message]);

      const similarities = await Promise.all(
        Object.entries(toolsButtonsParagraphs).map(async ([buttonName, { paragraphs }]) => {
          const paragraphEmbedding = await model.embed(paragraphs);
          const similarity = cosineSimilarity(
            inputEmbedding.arraySync()[0],
            paragraphEmbedding.arraySync()[0]
          );
          console.debug(`Similarity for ${buttonName}: ${similarity}`);
          return { buttonName, similarity };
        })
      );

      const bestMatch = similarities.reduce((prev, curr) =>
        curr.similarity > prev.similarity ? curr : prev
      );

      console.debug(`Best match: ${bestMatch.buttonName}`);
      setHighlightedButton(bestMatch.buttonName);
    } catch (error) {
      console.error('Error computing similarity:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1].text;
      console.debug(`New message detected: "${latestMessage}"`);
      computeSimilarity(latestMessage);
    }
  }, [messages, model]);

  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    console.debug('Calculating cosine similarity');
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    console.debug(`Cosine similarity: ${similarity}`);
    return similarity;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.debug('Mouse down event detected');
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
      console.debug(`Dragging to position: ${JSON.stringify(newPosition)}`);
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    console.debug('Mouse up event detected, stopping drag');
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      console.debug('Adding drag event listeners');
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      console.debug('Removing drag event listeners');
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
