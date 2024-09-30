// components/ControlButtons.tsx
import React, { useEffect } from "react";
import styles from "./ControlButtons.module.css";
import { useChat } from "../hooks/useChat";

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
  const { isMemEnabled, toggleMem, startMic, stopMic } = useChat();

  // Button text logic based on props state
  const camButtonText = isCamOn ? "Stop Cam 📷" : "Start Cam 📷";
  const micButtonText = isMicOn ? "Stop Mic 🎤" : "Start Mic 🎤";
  const pipButtonText = isPiP ? "Stop PiP 📹" : "Start PiP 📹";
  const memButtonText = isMemEnabled ? "Stop Mem 🧠" : "Start Mem 🧠";

  useEffect(() => {
    // Ensure microphone state is synced
    isMicOn ? startMic() : stopMic();
  }, [isMicOn, startMic, stopMic]);

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

      {/* Memory button */}
      <button
        onClick={toggleMem}
        className={`${styles.button} ${isMemEnabled ? styles.stopButton : styles.startButton}`}
      >
        {memButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
