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
  exitPiP: () => void; // Add exitPiP function as a prop
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCameraOn,
  isMicrophoneOn,
  toggleMicrophone,
  startCamera,
  stopCamera,
  isPiP,
  exitPiP, // Destructure exitPiP from props
}) => {
  // Handler for toggling the camera
  const handleCameraToggle = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className={styles.container}>
      {/* Camera Toggle Button */}
      <button onClick={handleCameraToggle} className={styles.button}>
        {isCameraOn ? "Stop Camera" : "Start Camera"}
      </button>

      {/* Exit PiP Button (only show if PiP is active) */}
      {isPiP && (
        <button onClick={exitPiP} className={styles.button}>
          Exit PiP
        </button>
      )}

      {/* Microphone Toggle Button */}
      <button onClick={toggleMicrophone} className={styles.button}>
        {isMicrophoneOn ? "Mute Microphone" : "Unmute Microphone"}
      </button>
    </div>
  );
};

export default ControlButtons;
