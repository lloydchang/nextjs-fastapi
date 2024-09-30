// components/VideoStream.tsx
import React, { useEffect } from 'react';
import styles from './VideoStream.module.css';

interface VideoStreamProps {
  isCamOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoStream: React.FC<VideoStreamProps> = ({ isCamOn, videoRef }) => {
  useEffect(() => {
    if (!isCamOn && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isCamOn, videoRef]);

  return <video ref={videoRef} className={styles.video} muted playsInline />;
};

export default VideoStream;
