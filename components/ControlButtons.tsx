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

      {/* PiP Control Buttons */}
      {isCameraOn && (
        <>
          {!isPiP ? (
            <button onClick={startPiP} className={styles.button}>
              Start PiP
            </button>
          ) : (
            <button onClick={stopPiP} className={styles.button}>
              Stop PiP
            </button>
          )}
        </>
      )}

      {/* Microphone Toggle Button */}
      <button onClick={toggleMicrophone} className={styles.button}>
        {isMicrophoneOn ? "Mute Microphone" : "Unmute Microphone"}
      </button>
    </div>
  );
};

export default ControlButtons;
