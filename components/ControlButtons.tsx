// components/ControlButtons.tsx

import React from 'react';
import styles from '../styles/ControlButtons.module.css';

interface ControlButtonsProps {
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => void;
  startCam: () => void;
  stopCam: () => void;
  isPipOn: boolean;
  togglePip: () => void;
  isMemOn: boolean;
  toggleMem: () => void;
  eraseMemory: () => void; 
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCamOn,
  isMicOn,
  toggleMic,
  startCam,
  stopCam,
  isPipOn,
  togglePip,
  isMemOn,
  toggleMem,
  eraseMemory,
}) => {
  console.log('ControlButtons props:', { isCamOn, isMicOn, isPipOn, isMemOn });

  // On : Off button text
  const micButtonText = isMicOn ? '🎤' : '🎤';
  const eraseButtonText = '🗑️';
  const camButtonText = isCamOn ? '📷' : '📷';
  const pipButtonText = isPipOn ? '📹' : '📹';
  const memButtonText = isMemOn ? '🧠' : '🧠';

  return (
    <div className={styles.container}>

      {/* Microphone Button */}
      <button
        type="button"
        onClick={toggleMic}
        className={`${styles.button} ${!isMicOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isMicOn}
        aria-label={micButtonText}
      >
        {micButtonText}
      </button>

      {/* Erase Button */}
      <button
        type="button"
        onClick={eraseMemory} 
        className={`${styles.button} ${styles.eraseButton}`}
        aria-label={eraseButtonText}
      >
        {eraseButtonText}
      </button>

      {/* Camera Button */}
      <button
        type="button"
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isCamOn}
        aria-label={camButtonText}
      >
        {camButtonText}
      </button>

      {/* Pip Button */}
      <button
        type="button"
        onClick={togglePip}
        className={`${styles.button} ${!isPipOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isPipOn}
        aria-label={pipButtonText}
      >
        {pipButtonText}
      </button>

      {/* Memory Button */}
      <button
        type="button"
        onClick={toggleMem}
        className={`${styles.button} ${isMemOn ? styles.stopButton : styles.startButton}`}
        aria-pressed={isMemOn}
        aria-label={memButtonText}
      >
        {memButtonText}
      </button>

    </div>
  );
};

export default React.memo(ControlButtons);
