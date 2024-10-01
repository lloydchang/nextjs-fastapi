// components/DebugPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/DebugPanel.module.css';

interface DebugPanelProps {
  logs: string[];
  curlCommand: string; // Add a prop for the curl command
  errorDetails?: string; // Optional prop for error details
}

const DebugPanel: React.FC<DebugPanelProps> = ({ logs, curlCommand, errorDetails }) => {
  const [isVisible, setIsVisible] = useState(false); // Start hidden
  const logContainerRef = useRef<HTMLDivElement>(null); // Ref for the log container
  const panelRef = useRef<HTMLDivElement>(null); // Ref for the panel
  const [isDragging, setIsDragging] = useState(false); // State for dragging
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Starting position for drag
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 }); // Panel position

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Utility function to split log messages into lines of max 80 characters
  const formatLogMessage = (message: string) => {
    const maxLength = 80;
    const lines = [];
    for (let i = 0; i < message.length; i += maxLength) {
      lines.push(message.substring(i, i + maxLength));
    }
    return lines;
  };

  // Auto-scroll to bottom whenever logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, errorDetails]); // Add errorDetails to dependency array

  // Handle mouse down event for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move event to update the panel position
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && panelRef.current) {
      const newX = e.clientX - dragStart.x + panelPosition.left;
      const newY = e.clientY - dragStart.y + panelPosition.top;
      setPanelPosition({ top: newY, left: newX });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Attach mouse move and mouse up events when dragging starts
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className={`${styles.debugPanel} ${isVisible ? '' : styles.hidden}`} // Apply hidden class conditionally
      ref={panelRef}
      style={{ top: panelPosition.top, left: panelPosition.left }} // Set the position of the panel
      onMouseDown={handleMouseDown} // Start dragging
    >
      <div className={styles.dragHandle}> {/* Drag handle area */}
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          {isVisible ? 'Hide Logs' : 'Show Logs'}
        </button>
      </div>
      {isVisible && (
        <div className={styles.logContainer} ref={logContainerRef}>
          <h2>Debug Logs</h2>
          {logs.map((log, index) => (
            <div key={index}>
              {formatLogMessage(log).map((line, lineIndex) => (
                <p key={lineIndex} className={styles.logItem}>{line}</p>
              ))}
            </div>
          ))}
          {errorDetails && (
            <div>
              <h3>Error Details</h3>
              {formatLogMessage(errorDetails).map((line, lineIndex) => (
                <p key={lineIndex} className={styles.logItem}>{line}</p>
              ))}
            </div>
          )}
          <h3>CURL Command</h3>
          <pre className={styles.curlCommand}>{curlCommand}</pre>
        </div>
      )}
      {!isVisible && <p className={styles.noLogsMessage}>Logs hidden. Click "Show Logs" to view.</p>}
    </div>
  );
};

export default DebugPanel;
