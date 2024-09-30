// components/ControlButtons.tsx
import React from 'react';
import styles from './ControlButtons.module.css';

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
      {/* Camera button */}
      <button
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${
          !isCamOn ? styles.startButton : styles.stopButton
        }`}
      >
        {camButtonText}
      </button>

      {/* PiP button */}
      <button
        onClick={togglePip}
        className={`${styles.button} ${
          !isPipOn ? styles.startButton : styles.stopButton
        }`}
      >
        {pipButtonText}
      </button>

      {/* Microphone button */}
      <button
        onClick={toggleMic}
        className={`${styles.button} ${
          !isMicOn ? styles.startButton : styles.stopButton
        }`}
      >
        {micButtonText}
      </button>

      {/* Memory button */}
      <button
        onClick={toggleMem}
        className={`${styles.button} ${
          isMemOn ? styles.stopButton : styles.startButton
        }`}
      >
        {memButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
