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
      // Optionally, you can hide the video element when the camera is off
      style={{ display: isCamOn ? 'block' : 'none' }}
      aria-label="User Camera Stream"
    />
  );
});

export default VideoStream;
