// src/components/AudioStream.tsx

import React, { useEffect } from "react";
import styles from "./AudioStream.module.css"; // Import CSS module for styling
import classNames from 'classnames'; // Optional: for easier class management

interface AudioStreamProps {
  isMicrophoneOn: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioStream: React.FC<AudioStreamProps> = ({ isMicrophoneOn, audioRef }) => {
  useEffect(() => {
    if (!isMicrophoneOn && audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [isMicrophoneOn, audioRef]);

  return (
    <audio
      ref={audioRef}
      className={classNames(styles.audio, { [styles.hidden]: !isMicrophoneOn })}
      muted
      autoPlay
    />
  );
};

export default AudioStream;
