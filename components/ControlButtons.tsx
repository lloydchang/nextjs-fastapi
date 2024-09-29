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
  return (
    <div className={styles.container}>
      <button onClick={isCameraOn ? stopCamera : startCamera} className={styles.button}>
        {isCameraOn ? "Stop Camera" : "Start Camera"}
      </button>
      <button onClick={toggleMicrophone} className={styles.button}>
        {isMicrophoneOn ? "Mute Microphone" : "Unmute Microphone"}
      </button>
      {isCameraOn && (
        <button onClick={() => {
          if (isPiP) {
            document.exitPictureInPicture().catch(err => console.error("Failed to exit PiP:", err));
          } else if (document.pictureInPictureEnabled) {
            const video = document.querySelector("video");
            if (video) {
              (video as HTMLVideoElement).requestPictureInPicture().catch(err => console.error("Failed to enter PiP:", err));
            }
          }
        }} className={styles.button}>
          {isPiP ? "Exit PiP" : "Enter PiP"}
        </button>
      )}
    </div>
  );
};

export default ControlButtons;
