// src/components/VideoStream.tsx
import React, { useEffect } from "react";
import styles from "./VideoStream.module.css"; // Import CSS module for styling
import classNames from 'classnames'; // Optional: for easier class management

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
      className={classNames(styles.video, { [styles.hidden]: !isCameraOn })}
      muted
      playsInline
    />
  );
};

export default VideoStream;
