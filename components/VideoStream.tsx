// components/VideoStream.tsx
import React, { useEffect } from "react";
import styles from "./VideoStream.module.css";
import classNames from 'classnames';

interface VideoStreamProps {
  isCamOn: boolean; // Updated prop
  isPiP: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoStream: React.FC<VideoStreamProps> = ({ isCamOn, isPiP, videoRef }) => {
  useEffect(() => {
    if (!isCamOn && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isCamOn, videoRef]);

  return (
    <video ref={videoRef} className={classNames(styles.video, { [styles.hidden]: !isCamOn || isPiP })} muted playsInline />
  );
};

export default VideoStream;
