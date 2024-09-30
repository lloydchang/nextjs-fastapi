// hooks/useMedia.ts

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
  audioRef: React.RefObject<HTMLAudioElement>;
  startCam: () => Promise<void>;
  stopCam: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  togglePip: () => Promise<void>;
  toggleMem: () => void;
}

export const useMedia = (): UseMediaReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isCamOn: false,
    isMicOn: false,
    isPipOn: false,
    isMemOn: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Start Camera
  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setMediaState((prev) => ({ ...prev, isCamOn: true }));
      }
    } catch (err) {
      console.error('Unable to access camera. Please check permissions.', err);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop Camera
  const stopCam = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaState((prev) => ({ ...prev, isCamOn: false }));
  }, []);

  // Start Microphone
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
      }
    } catch (err) {
      console.error('Unable to access microphone. Please check permissions.', err);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  // Stop Microphone
  const stopMic = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setMediaState((prev) => ({ ...prev, isMicOn: false }));
  }, []);

  // Toggle Picture-in-Picture
  const togglePip = useCallback(async () => {
    if (!mediaState.isPipOn) {
      if (videoRef.current) {
        try {
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
        } catch (err) {
          console.error('Unable to enter PiP mode.', err);
          alert('Unable to enter PiP mode.');
        }
      }
    } else {
      try {
        await document.exitPictureInPicture();
        setMediaState((prev) => ({ ...prev, isPipOn: false }));
      } catch (err) {
        console.error('Unable to exit PiP mode.', err);
        alert('Unable to exit PiP mode.');
      }
    }
  }, [mediaState.isPipOn]);

  // Toggle Memory
  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCam();
      stopMic();
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mediaState,
    videoRef,
    audioRef,
    startCam,
    stopCam,
    startMic,
    stopMic,
    togglePip,
    toggleMem,
  };
};
