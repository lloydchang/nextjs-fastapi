import React from "react";
import styles from "./ControlButtons.module.css";

interface ControlButtonsProps {
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => void;
  startCam: () => void;
  stopCam: () => void;
  isPipOn: boolean; // Updated variable name
  startPip: () => void; // Updated to new function name
  stopPip: () => void; // Updated to new function name
  isMemOn: boolean; // Memory state prop
  toggleMem: () => void; // Toggle function for memory
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCamOn,
  isMicOn,
  toggleMic,
  startCam,
  stopCam,
  isPipOn, // Updated variable name
  startPip, // Updated to new function name
  stopPip, // Updated to new function name
  isMemOn,
  toggleMem, // Receive toggle function for memory
}) => {
  const camButtonText = isCamOn ? "Stop Cam 📷" : "Start Cam 📷";
  const micButtonText = isMicOn ? "Stop Mic 🎤" : "Start Mic 🎤";
  const pipButtonText = isPipOn ? "Stop Pip 📹" : "Start Pip 📹"; // Updated variable name
  const memButtonText = isMemOn ? "Stop Memory 🧠" : "Start Memory 🧠"; // Memory button text

  return (
    <div className={styles.container}>
      {/* Camera button */}
      <button
        onClick={isCamOn ? stopCam : startCam}
        className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}
      >
        {camButtonText}
      </button>

      {/* Pip button, only visible when camera is on */}
      {isCamOn && (
        <button
          onClick={isPipOn ? stopPip : startPip}
          className={`${styles.button} ${isPipOn ? styles.stopButton : styles.startButton}`}
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

      {/* Memory button */}
      <button
        onClick={toggleMem} // Use the toggle function for memory
        className={`${styles.button} ${isMemOn ? styles.stopButton : styles.startButton}`}
      >
        {memButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
