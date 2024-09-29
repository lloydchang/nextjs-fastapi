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

  const camButtonText = isCamOn ? "Stop Cam 📷" : "Start Cam 📷";
  const micButtonText = isMicOn ? "Stop Mic 🎤" : "Start Mic 🎤";
  const memButtonText = isMemEnabled ? "Stop Mem 🧠" : "Start Mem 🧠";

  useEffect(() => {
    isMicOn ? startMic() : stopMic();
  }, [isMicOn, startMic, stopMic]);

  return (
    <div className={styles.container}>
      <button onClick={isCamOn ? stopCam : startCam} className={`${styles.button} ${!isCamOn ? styles.startButton : styles.stopButton}`}>
        {camButtonText}
      </button>
      {isCamOn && (
        <button onClick={isPiP ? stopPiP : startPiP} className={`${styles.button} ${isPiP ? styles.stopButton : styles.startButton}`}>
          {isPiP ? "Stop PiP 📹" : "Start PiP 📹"}
        </button>
      )}
      <button onClick={toggleMic} className={`${styles.button} ${!isMicOn ? styles.startButton : styles.stopButton}`}>
        {micButtonText}
      </button>
      <button onClick={toggleMem} className={`${styles.button} ${isMemEnabled ? styles.stopButton : styles.startButton}`}>
        {memButtonText}
      </button>
    </div>
  );
};

export default ControlButtons;
