// components/AudioStream.tsx

import React, { useEffect } from 'react';
import styles from './AudioStream.module.css';

interface AudioStreamProps {
  isMicOn: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioStream: React.FC<AudioStreamProps> = ({ isMicOn, audioRef }) => {
  useEffect(() => {
    if (!isMicOn && audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [isMicOn, audioRef]);

  return <audio ref={audioRef} className={styles.audio} muted autoPlay />;
};

export default AudioStream;
