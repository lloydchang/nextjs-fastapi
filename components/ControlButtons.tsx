// src/components/ControlButtons.tsx

import React, { useEffect } from "react";
import styles from "./ControlButtons.module.css";
import { useChat } from "../hooks/useChat";

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
  const { startHearing, stopHearing } = useChat();

  const cameraButtonText = isCameraOn ? (
    <>
      Stop Cam <span className={styles.emojiBackground}>🚫 📷</span>
    </>
  ) : isMicrophoneOn ? (
    "Start Cam 📷"
  ) : (
    "Start Cam 📷 and Mic 🎤"
  );

  const microphoneButtonText = isMicrophoneOn ? (
    <>
      Stop Mic <span className={styles.emojiBackground}>🚫 🎤</span>
    </>
  ) : (
    "Start Mic 🎤"
  );

  const startPiPButtonText = (
    <>
      Start PiP 📹
    </>
  );

  const stopPiPButtonText = (
    <>
      Stop PiP <span className={styles.emojiBackground}>🚫 📹</span>
    </>
  );

  const handleMicrophoneToggle = () => {
    toggleMicrophone();
  };

  useEffect(() => {
    if (isMicrophoneOn) {
      startHearing();
    } else {
      stopHearing();
    }
  }, [isMicrophoneOn, startHearing, stopHearing]);

  return (
    <div className={styles.container}>
      <button
        onClick={isCameraOn ? stopCamera : startCamera}
        className={`${styles.button} ${!isCameraOn ? styles.startButton : styles.stopButton}`}
      >
        {cameraButtonText}
      </button>

      {isCameraOn && (
        <>
          {!isPiP ? (
            <button
              onClick={startPiP}
              className={`${styles.button} ${styles.startButton}`}
            >
              {startPiPButtonText}
            </button>
          ) : (
            <button
              onClick={stopPiP}
              className={`${styles.button} ${styles.stopButton}`}
            >
              {stopPiPButtonText}
            </button>
          )}
        </>
      )}

      <button
        onClick={handleMicrophoneToggle}
        className={`${styles.button} ${!isMicrophoneOn ? styles.startButton : styles.stopButton}`}
      >
        {microphoneButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
