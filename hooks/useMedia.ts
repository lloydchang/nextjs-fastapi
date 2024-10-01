// hooks/useMedia.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';

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
    isMicOn: false,
    isPipOn: false,
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const isMicOnRef = useRef(mediaState.isMicOn);
  const isPipOnRef = useRef(mediaState.isPipOn);

  // Use the custom speech recognition hook
  const { startHearing, stopHearing } = useSpeechRecognition((transcript, isFinal) => {
    console.log(`Recognized speech: "${transcript}", Final: ${isFinal}`);
  });

  // Start Camera
  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) return;
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
    if (isMicOnRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
        isMicOnRef.current = true;
        startHearing(); // Start speech recognition when mic is started
      }
    } catch (err) {
      console.error('Unable to access microphone.', err);
      alert('Unable to access microphone.');
    }
  }, [startHearing]);

  // Stop Microphone
  const stopMic = useCallback(() => {
    if (!isMicOnRef.current) return;
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setMediaState((prev) => ({ ...prev, isMicOn: false }));
    isMicOnRef.current = false;
    stopHearing(); // Stop speech recognition when mic is stopped
  }, [stopHearing]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
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
