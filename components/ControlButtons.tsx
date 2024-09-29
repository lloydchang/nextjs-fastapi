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
  // useChat hook integration for speech-to-text hearing
  const { startHearing, stopHearing } = useChat();

  // Camera button text based on state
  const cameraButtonText = isCameraOn ? (
    <>
      Stop Cam <span className={styles.emojiBackground}>🚫 📷</span>
    </>
  ) : isMicrophoneOn ? (
    "Start Cam 📷"
  ) : (
    "Start Cam 📷 and Mic 🎤"
  );

  // Microphone button text based on state
  const microphoneButtonText = isMicrophoneOn ? (
    <>
      Stop Mic <span className={styles.emojiBackground}>🚫 🎤</span>
    </>
  ) : (
    "Start Mic 🎤"
  );

  // Picture-in-Picture button text based on state
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

  // Toggle microphone state
  const handleMicrophoneToggle = () => {
    toggleMicrophone(); // This will toggle the mic on/off
  };

  // Synchronize hearing with microphone state automatically
  useEffect(() => {
    if (isMicrophoneOn) {
      startHearing(); // Automatically start hearing when mic is on
    } else {
      stopHearing(); // Automatically stop hearing when mic is off
    }
  }, [isMicrophoneOn, startHearing, stopHearing]);

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

      {/* Microphone Toggle Button */}
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
