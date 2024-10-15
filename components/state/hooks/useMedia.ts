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
  audioRef: React.RefObject<HTMLAudioElement>;
  startCam: () => Promise<void>;
  stopCam: () => void;
  toggleMic: () => Promise<void>;
  togglePip: () => Promise<void>;
  toggleMem: () => void;
}

// Default media state
export const useMedia = (): UseMediaReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isCamOn: false,
    isMicOn: false, // Initialize microphone as off by default
    isPipOn: false,
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    console.log('Media State Updated:', mediaState);
  }, [mediaState]);

  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setMediaState((prev) => ({ ...prev, isCamOn: true }));
      }
    } catch (err) {
      console.error('Unable to access camera.', err);
      alert('Unable to access camera.');
    }
  }, [mediaState.isCamOn]);

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

  const toggleMic = useCallback(async () => {
    console.log('Toggling Mic. Current State:', mediaState.isMicOn);
    if (!mediaState.isMicOn) {
      // Attempt to start microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioStreamRef.current = stream;
          setMediaState((prev) => ({ ...prev, isMicOn: true }));
        }
      } catch (err) {
        console.error('Unable to access microphone.', err);
        alert('Microphone access is required for speech recognition.');
      }
    } else {
      // Stop microphone
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
      setMediaState((prev) => ({ ...prev, isMicOn: false }));
    }
  }, [mediaState.isMicOn]);

  const togglePip = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (!mediaState.isCamOn) {
          await startCam();
        }
        if (!mediaState.isPipOn) {
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
        } else {
          await document.exitPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: false }));
        }
      } catch (err) {
        console.error('Unable to toggle PiP mode.', err);
      }
    }
  }, [mediaState.isCamOn, mediaState.isPipOn, startCam]);

  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
  }, []);

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

useEffect(() => {
  const storedMicState = localStorage.getItem('isMicOn');
  if (storedMicState === 'true') {
    toggleMic(); // Initialize microphone based on stored state
  }
}, [toggleMic]);

  return {
    mediaState,
    videoRef,
    audioRef,
    startCam,
    stopCam,
    toggleMic,
    togglePip,
    toggleMem,
  };
};

export default useMedia;
