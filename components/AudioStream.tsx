// components/AudioStream.tsx

import React from 'react';
import styles from '../styles/AudioStream.module.css';

interface AudioStreamProps {
  isMicOn: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioStream: React.FC<AudioStreamProps> = React.memo(({ isMicOn, audioRef }) => {
  return (
    <audio
      ref={audioRef}
      className={styles.audio}
      muted={!isMicOn}  // Mute the audio if the microphone is off
      autoPlay
      style={{ display: isMicOn ? 'block' : 'none' }}
    />
  );
});

export default AudioStream;
