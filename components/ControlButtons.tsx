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
}) => {
  const camButtonText = isCamOn ? 'Stop Cam 📷' : 'Start Cam 📷';
  const micButtonText = isMicOn ? 'Stop Mic 🎤' : 'Start Mic 🎤';
  const pipButtonText = isPipOn ? 'Stop PiP 📹' : 'Start PiP 📹';
  const memButtonText = isMemOn ? 'Stop Memory 🧠' : 'Start Memory 🧠';

  return (
    <div className={styles.container}>
      {/* Camera Button */}
      <button
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isCamOn}
        aria-label={camButtonText}
      >
        {camButtonText}
      </button>

      {/* PiP Button */}
      <button
        onClick={togglePip}
        className={`${styles.button} ${!isPipOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isPipOn}
        aria-label={pipButtonText}
      >
        {pipButtonText}
      </button>

      {/* Microphone Button */}
      <button
        onClick={toggleMic}
        className={`${styles.button} ${!isMicOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isMicOn}
        aria-label={micButtonText}
      >
        {micButtonText}
      </button>

      {/* Memory Button */}
      <button
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
