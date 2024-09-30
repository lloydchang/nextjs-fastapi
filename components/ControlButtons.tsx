import React from "react";
import styles from "./ControlButtons.module.css";

interface ControlButtonsProps {
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => void;
  startCam: () => void;
  stopCam: () => void;
  isPiP: boolean;
  startPiP: () => void;
  stopPiP: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCamOn,
  isMicOn,
  toggleMic,
  startCam,
  stopCam,
  isPiP,
  startPiP,
  stopPiP,
}) => {
  // Button text logic based on props state
  const camButtonText = isCamOn ? "Stop Cam 📷" : "Start Cam 📷";
  const micButtonText = isMicOn ? "Stop Mic 🎤" : "Start Mic 🎤";
  const pipButtonText = isPiP ? "Stop PiP 📹" : "Start PiP 📹";

  return (
    <div className={styles.container}>
      {/* Camera button */}
      <button
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}
      >
        {camButtonText}
      </button>

      {/* PiP button, only visible when camera is on */}
      {isCamOn && (
        <button
          onClick={isPiP ? stopPiP : startPiP}
          className={`${styles.button} ${isPiP ? styles.stopButton : styles.startButton}`}
        >
          {pipButtonText}
        </button>
      )}

      {/* Microphone button */}
      <button
        onClick={toggleMic}
        className={`${styles.button} ${!isMicOn ? styles.startButton : styles.stopButton}`}
      >
        {micButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
