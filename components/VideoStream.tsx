// src/components/VideoStream.tsx
import React, { useEffect } from "react";
import styles from "./VideoStream.module.css"; // Import CSS module for styling

interface VideoStreamProps {
  isCameraOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoStream: React.FC<VideoStreamProps> = ({ isCameraOn, videoRef }) => {
  useEffect(() => {
    if (!isCameraOn && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isCameraOn, videoRef]);

  return (
    <video
      ref={videoRef}
      className={styles.video}
      muted
      playsInline
    />
  );
};

export default VideoStream;
