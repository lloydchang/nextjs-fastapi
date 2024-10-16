// File: components/state/hooks/useMedia.ts

import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaState {
  isCamOn: boolean;
  isMicOn: boolean;
  isPipOn: boolean;
  isMemOn: boolean;
}

interface UseMediaReturn {
  mediaState: MediaState;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCam: () => Promise<void>;
  stopCam: () => void;
  toggleMic: () => Promise<void>;
  togglePip: () => Promise<void>;
  toggleMem: () => void;
}

export const useMedia = (): UseMediaReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isCamOn: false,
    isMicOn: false, // Microphone is initialized as OFF by default
    isPipOn: false,
    isMemOn: true,
  });
  const [micStream, setMicStream] = useState<MediaStream | null>(null); // Manage mic stream with state
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null); // Track camera stream for cleanup

  // Automatically start the microphone when the component mounts or if `isMicOn` changes
  useEffect(() => {
    const initializeMic = async () => {
      if (mediaState.isMicOn && !micStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(stream); // Store the mic stream for later cleanup
        } catch (err) {
          console.error('Unable to access microphone:', err);
        }
      }
    };

    initializeMic();

    return () => {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop()); // Stop microphone on cleanup
        setMicStream(null);
      }
    };
  }, [mediaState.isMicOn, micStream]);

  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream; // Store the camera stream for later cleanup

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setMediaState((prev) => ({ ...prev, isCamOn: true }));
    } catch (err) {
      console.error('Unable to access camera.', err);
    }
  }, [mediaState.isCamOn]);

  const stopCam = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop()); // Stop the camera stream
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setMediaState((prev) => ({ ...prev, isCamOn: false }));
  }, []);

  const toggleMic = useCallback(async () => {
    if (!mediaState.isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream); // Store the mic stream
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
      } catch (err) {
        console.error('Unable to access microphone.', err);
      }
    } else {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop()); // Stop the microphone
        setMicStream(null);
      }
      setMediaState((prev) => ({ ...prev, isMicOn: false }));
    }
  }, [mediaState.isMicOn, micStream]);

  const togglePip = useCallback(async () => {
    if (videoRef.current) {
      if (!mediaState.isCamOn) await startCam(); // Ensure the camera is on before enabling PiP

      if (!mediaState.isPipOn) {
        try {
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
        } catch (error) {
          console.error('Failed to enable Picture-in-Picture:', error);
        }
      } else {
        await document.exitPictureInPicture();
        setMediaState((prev) => ({ ...prev, isPipOn: false }));
      }
    }
  }, [mediaState.isCamOn, mediaState.isPipOn, startCam]);

  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
  }, []);

  // Cleanup camera stream when the component unmounts
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    mediaState,
    videoRef,
    startCam,
    stopCam,
    toggleMic,
    togglePip,
    toggleMem,
  };
};

export default useMedia;
