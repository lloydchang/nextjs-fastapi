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
}

export const useMedia = (): UseMediaReturn => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isCamOn: false,
    isMicOn: true, // Set microphone on by default
    isPipOn: false,
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const isMicOnRef = useRef(mediaState.isMicOn);
  const isPipOnRef = useRef(mediaState.isPipOn);

  // Start Camera
  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) {
      console.log('Camera is already on.');
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
    if (isMicOnRef.current) {
      console.log('Microphone is already on.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
        isMicOnRef.current = true; // Update the ref to track mic state
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
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setMediaState((prev) => ({ ...prev, isMicOn: false }));
    isMicOnRef.current = false; // Update the ref to track mic state
  }, []);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    console.log(`Toggling mic. Current state: ${mediaState.isMicOn}`);
    mediaState.isMicOn ? stopMic() : startMic();
  }, [mediaState.isMicOn, startMic, stopMic]);

  // Toggle Picture-in-Picture
  const togglePip = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (!isPipOnRef.current) {
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
          isPipOnRef.current = true;
        } else {
          await document.exitPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: false }));
          isPipOnRef.current = false;
        }
      } catch (err) {
        console.error('Unable to toggle PiP mode.', err);
      }
    }
  }, []);

  // Toggle Memory
  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
  }, []);

  // Automatically start microphone on component mount
  useEffect(() => {
    startMic();
  }, [startMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  };
};
