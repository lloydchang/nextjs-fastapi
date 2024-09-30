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
  toggleMic: () => void;
  togglePip: () => Promise<void>;
  toggleMem: () => void;
  eraseMemory: () => void;
}

export const useMedia = (): UseMediaReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isCamOn: false,
    isMicOn: false, // Initialize mic as off
    isPipOn: false,
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Track the microphone and PiP state separately to prevent state conflicts
  const isMicOnRef = useRef(mediaState.isMicOn);
  const isPipOnRef = useRef(mediaState.isPipOn);

  // Log state changes
  useEffect(() => {
    console.log('Media State Updated:', mediaState);
    isMicOnRef.current = mediaState.isMicOn;
    isPipOnRef.current = mediaState.isPipOn;
  }, [mediaState]);

  // Start Camera
  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) {
      console.log('Camera is already on.');
      return;
    }
    try {
      console.log('Attempting to start camera.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setMediaState((prev) => ({ ...prev, isCamOn: true }));
        console.log('Camera started.');
      }
    } catch (err) {
      console.error('Unable to access camera.', err);
      alert('Unable to access camera.');
    }
  }, [mediaState.isCamOn]);

  // Stop Camera
  const stopCam = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
      console.log('Camera stream stopped.');
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log('Camera srcObject cleared.');
    }
    setMediaState((prev) => ({ ...prev, isCamOn: false }));
    console.log('Camera stopped.');
  }, []);

  // Toggle Microphone and Speech Recognition
  const toggleMic = useCallback(() => {
    if (mediaState.isMicOn) {
      console.log('Toggling microphone off.');
      stopMic();
    } else {
      console.log('Toggling microphone on.');
      startMic();
    }
  }, [mediaState.isMicOn, startMic, stopMic]);

  // Start Microphone
  const startMic = useCallback(async () => {
    if (isMicOnRef.current) {
      console.log('Microphone is already on.');
      return;
    }
    try {
      console.log('Attempting to start microphone.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
        console.log('Microphone started successfully.');
      }
    } catch (err) {
      console.error('Unable to access microphone.', err);
      alert('Unable to access microphone.');
    }
  }, []);

  // Stop Microphone
  const stopMic = useCallback(() => {
    if (!isMicOnRef.current) {
      console.log('Microphone is already off.');
      return;
    }
    if (audioStreamRef.current) {
      console.log('Stopping microphone.');
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      console.log('Microphone srcObject cleared.');
    }
    setMediaState((prev) => ({ ...prev, isMicOn: false }));
    console.log('Microphone stopped successfully.');
  }, []);

  // Toggle Picture-in-Picture
  const togglePip = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (!isPipOnRef.current) {
          console.log('Entering Picture-in-Picture mode.');
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
          console.log('Picture-in-Picture mode entered.');
        } else {
          console.log('Exiting Picture-in-Picture mode.');
          await document.exitPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: false }));
          console.log('Picture-in-Picture mode exited.');
        }
      } catch (err) {
        console.error('Unable to toggle PiP mode.', err);
      }
    }
  }, []);

  // Toggle Memory
  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
    console.log(`Memory toggled to: ${!mediaState.isMemOn}`);
  }, [mediaState.isMemOn]);

  // Erase Memory
  const eraseMemory = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: false }));
    console.log('Memory erased.');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up useMedia.');
      stopCam();
      stopMic();
      if (isPipOnRef.current) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
    };
  }, [stopCam, stopMic]);

  return {
    mediaState,
    videoRef,
    audioRef,
    startCam,
    stopCam,
    toggleMic,
    togglePip,
    toggleMem,
    eraseMemory,
  };
};
