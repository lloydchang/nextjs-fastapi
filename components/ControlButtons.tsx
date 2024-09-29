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
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isCameraOn,
  isMicrophoneOn,
  toggleMicrophone,
  startCamera,
  stopCamera,
  isPiP,
}) => {
  // Handler for toggling the camera
  const handleCameraToggle = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Handler for toggling Picture-in-Picture
  const handlePiPToggle = async () => {
    const videoElement = document.querySelector("video") as HTMLVideoElement | null;
    if (!videoElement) {
      console.error("Video element not found for PiP toggle.");
      return;
    }

    if (isPiP) {
      try {
        await document.exitPictureInPicture();
      } catch (error) {
        console.error("Failed to exit PiP:", error);
      }
    } else {
      if (document.pictureInPictureEnabled) {
        try {
          await videoElement.requestPictureInPicture();
        } catch (error) {
          console.error("Failed to enter PiP:", error);
        }
      } else {
        alert("Picture-in-Picture is not supported by your browser.");
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Camera Toggle Button */}
      <button onClick={handleCameraToggle} className={styles.button}>
        {isCameraOn ? "Stop Camera" : "Start Camera"}
      </button>

      {/* Microphone Toggle Button */}
      <button onClick={toggleMicrophone} className={styles.button}>
        {isMicrophoneOn ? "Mute Microphone" : "Unmute Microphone"}
      </button>

      {/* PiP Toggle Button (only show if camera is on) */}
      {isCameraOn && (
        <button onClick={handlePiPToggle} className={styles.button}>
          {isPiP ? "Exit PiP" : "Enter PiP"}
        </button>
      )}
    </div>
  );
};

export default ControlButtons;
