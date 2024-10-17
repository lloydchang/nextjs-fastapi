// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import toolsButtonsParagraphs from './toolsButtonsParagraphs';
import styles from 'styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [highlightedButton, setHighlightedButton] = useState<string | null>(null);
  const [model, setModel] = useState<use.UniversalSentenceEncoder | null>(null);

  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  const messages = useSelector((state: RootState) => state.chat.messages);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        const loadedModel = await use.load();
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading TensorFlow model:', error);
      }
    };
    loadModel();
  }, []);

  const computeSimilarity = async (message: string) => {
    if (!model) return;

    try {
      const inputEmbedding = await model.embed([message]);

      const similarities = await Promise.all(
        Object.entries(toolsButtonsParagraphs).map(async ([buttonName, { paragraphs }]) => {
          const paragraphEmbedding = await model.embed(paragraphs);
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

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1].text;
      computeSimilarity(latestMessage);
    }
  }, [messages, model]);

  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
            {/* Render the flashing arrow only once next to the highlighted button */}
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
