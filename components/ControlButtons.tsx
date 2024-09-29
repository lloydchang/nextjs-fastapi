// src/components/ControlButtons.tsx

import React from "react";
import styles from "./ControlButtons.module.css"; // Import CSS module for styling

interface ControlButtonsProps {
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  toggleMicrophone: () => void;
  startCamera: () => void;
  stopCamera: () => void;
  isPiP: boolean;
  startPiP: () => void; // Function to start PiP
  stopPiP: () => void;  // Function to stop PiP
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCameraOn,
  isMicrophoneOn,
  toggleMicrophone,
  startCamera,
  stopCamera,
  isPiP,
  startPiP,
  stopPiP,
}) => {
  // Determine button text for Camera/Microphone based on their states
  const cameraButtonText = isCameraOn
    ? "Stop Cam 🚫 📷"
    : isMicrophoneOn
    ? "Start Cam 📷"
    : "Start Cam 📷 and Mic 🎤";

  const microphoneButtonText = isMicrophoneOn
    ? "Stop Mic 🚫 🎤"
    : "Start Mic Only 🎤";

  return (
    <div className={styles.container}>
      {/* Camera Toggle Button */}
      <button
        onClick={isCameraOn ? stopCamera : startCamera}
        className={`${styles.button} ${!isCameraOn ? styles.startButton : styles.stopButton}`}
      >
        {cameraButtonText}
      </button>

      {/* PiP Control Buttons */}
      {isCameraOn && (
        <>
          {!isPiP ? (
            <button
              onClick={startPiP}
              className={`${styles.button} ${styles.startButton}`}
            >
              Start PiP 📹
            </button>
          ) : (
            <button
              onClick={stopPiP}
              className={`${styles.button} ${styles.stopButton}`}
            >
              Stop PiP 🚫 📹
            </button>
          )}
        </>
      )}

      {/* Microphone Toggle Button */}
      {!isCameraOn && (
        <button
          onClick={toggleMicrophone}
          className={`${styles.button} ${!isMicrophoneOn ? styles.startButton : styles.stopButton}`}
        >
          {microphoneButtonText}
        </button>
      )}
    </div>
  );
};

export default ControlButtons;
