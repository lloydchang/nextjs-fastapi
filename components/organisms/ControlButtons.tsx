// File: components/organisms/ControlButtons.tsx

import React from 'react';
import styles from '../../styles/components/organisms/ControlButtons.module.css';

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
  isInfoOn: boolean; // Prop name matches what is used in ChatPanel
  toggleInfo: () => void;
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
  isInfoOn,
  toggleInfo,
}) => {
  console.log('ControlButtons props:', { isCamOn, isMicOn, isPipOn, isMemOn });

  // On : Off button text
  const micButtonText = isMicOn ? '🎤' : '🎤';
  const eraseButtonText = '🗑️';
  const camButtonText = isCamOn ? '📷' : '📷';
  const pipButtonText = isPipOn ? '📹' : '📹';
  const memButtonText = isMemOn ? '🧠' : '🧠';
  const infoButtonText = 'ℹ️';

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
      {/* Hidden: Do not render Camera Button */}
      {/* <button
        type="button"
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isCamOn}
        aria-label={camButtonText}
      >
        {camButtonText}
      </button> */}

      {/* Pip Button */}
      {/* Hidden: Do not render Pip Button */}
      {/* <button
        type="button"
        onClick={togglePip}
        className={`${styles.button} ${!isPipOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isPipOn}
        aria-label={pipButtonText}
      >
        {pipButtonText}
      </button> */}

      {/* Memory Button */}
      {/* Hidden: Do not render Memory Button */}
      {/* <button
        type="button"
        onClick={toggleMem}
        className={`${styles.button} ${isMemOn ? styles.stopButton : styles.startButton}`}
        aria-pressed={isMemOn}
        aria-label={memButtonText}
      >
        {memButtonText}
      </button> */}

      {/* Info Mode Button */}
      {/* Hidden: Do not render Info Button */}
      {/* <button
        type="button"
        onClick={toggleInfo}
        className={`${styles.button} ${isInfoOn ? styles.stopButton : styles.startButton}`}
        aria-pressed={isInfoOn}
        aria-label="Info Mode"
      >
        {infoButtonText}
      </button> */}

    </div>
  );
};

export default React.memo(ControlButtons);
