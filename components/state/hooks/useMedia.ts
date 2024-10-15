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
    isMicOn: true, // Initialize microphone as ON by default
    isPipOn: false,
    isMemOn: true,
  });
  const [micStream, setMicStream] = useState<MediaStream | null>(null); // Handle mic stream with state
  const videoRef = useRef<HTMLVideoElement>(null);

  // Automatically start the microphone when the component mounts
  useEffect(() => {
    const initializeMic = async () => {
      if (mediaState.isMicOn && !micStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(stream); // Store the mic stream
        } catch (err) {
          console.error('Unable to access microphone:', err);
        }
      }
    };
    initializeMic();
  }, [mediaState.isMicOn, micStream]);

  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMediaState((prev) => ({ ...prev, isCamOn: true }));
      }
    } catch (err) {
      console.error('Unable to access camera.', err);
    }
  }, [mediaState.isCamOn]);

  const stopCam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
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
      if (!mediaState.isCamOn) await startCam();
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
