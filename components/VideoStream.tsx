// components/VideoStream.tsx

import React from 'react';
import styles from './VideoStream.module.css';

interface VideoStreamProps {
  isCamOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoStream: React.FC<VideoStreamProps> = React.memo(({ isCamOn, videoRef }) => {
  return (
    <video
      ref={videoRef}
      className={styles.video}
      muted
      playsInline
      autoPlay
      style={{ display: isCamOn ? 'block' : 'none' }}
    />
  );
});

export default VideoStream;
