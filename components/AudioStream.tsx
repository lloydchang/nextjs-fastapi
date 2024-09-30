// components/AudioStream.tsx

import React from 'react';
import styles from './AudioStream.module.css';

interface AudioStreamProps {
  isMicOn: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioStream: React.FC<AudioStreamProps> = ({ isMicOn, audioRef }) => {
  return (
    <audio
      ref={audioRef}
      className={styles.audio}
      muted
      autoPlay
      // Hide the audio element when the microphone is off
      style={{ display: isMicOn ? 'block' : 'none' }}
    />
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(AudioStream);
