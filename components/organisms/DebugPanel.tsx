// components/organisms/DebugPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/DebugPanel.module.css';

interface DebugPanelProps {
  logs: string[];
  curlCommand?: string; // Make curlCommand optional
  errorDetails?: string; // Optional prop for error details
}

const DebugPanel: React.FC<DebugPanelProps> = ({ logs, curlCommand, errorDetails }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Automatically scroll to the bottom when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, errorDetails]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    setPosition({
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0),
    });
  };

  // Handle drag movement
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - position.x;
      const newY = e.clientY - position.y;

      if (panelRef.current) {
        panelRef.current.style.left = `${newX}px`;
        panelRef.current.style.top = `${newY}px`;
      }
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className={`${styles.debugPanel} ${isVisible ? '' : styles.hidden}`}
      style={{ top: '0px', left: '0px', position: 'fixed' }} // Initial position set at top-left corner
    >
      <div
        className={styles.dragHandle}
        onMouseDown={handleMouseDown} // Start dragging on mouse down
      >
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          {isVisible ? 'Hide' : ''}
        </button>
      </div>
      {isVisible && (
        <div className={styles.logContainer} ref={logContainerRef}>
          {logs.map((log, index) => (
            <div key={index} className={styles.logItem}>
              {log}
            </div>
          ))}
          {errorDetails && (
            <div>
              <h3>Error Details</h3>
              <p>{errorDetails}</p>
            </div>
          )}
          {curlCommand && curlCommand !== 'Example CURL Command' && (
            <>
              <h3>CURL Command</h3>
              <pre className={styles.curlCommand}>{curlCommand}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
