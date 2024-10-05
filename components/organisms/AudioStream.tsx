// components/organisms/AudioStream.tsx

import React from 'react';
import styles from '../../styles/components/organisms/AudioStream.module.css';

interface AudioStreamProps {
  isMicOn: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioStream: React.FC<AudioStreamProps> = React.memo(({ isMicOn, audioRef }) => {
  return (
    <audio
      ref={audioRef}
      className={styles.audio}
      muted
      autoPlay
      style={{ display: isMicOn ? 'block' : 'none' }}
    />
  );
});

export default AudioStream;
