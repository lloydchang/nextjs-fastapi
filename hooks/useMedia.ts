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
    isMemOn: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const handlePermissionChangeRef = useRef<() => void>(() => {});

  // Start Camera
  const startCam = useCallback(async () => {
    if (mediaState.isCamOn) {
      console.warn('Camera is already on.');
      return;
    }
    try {
      console.log('Attempting to start camera.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setMediaState((prev) => {
          console.log('Camera started.');
          return { ...prev, isCamOn: true };
        });
      }
    } catch (err) {
      console.error('Unable to access camera. Please check permissions.', err);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [mediaState.isCamOn]);

  // Stop Camera
  const stopCam = useCallback(() => {
    if (videoStreamRef.current) {
      console.log('Stopping camera.');
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
    if (mediaState.isMicOn) {
      console.warn('Microphone is already on.');
      return;
    }
    try {
      console.log('Attempting to start microphone.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        // Removed play() as it's unnecessary for microphone streams
        setMediaState((prev) => {
          console.log('Microphone started.');
          return { ...prev, isMicOn: true };
        });
      }
    } catch (err) {
      console.error('Unable to access microphone. Please check permissions.', err);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, [mediaState.isMicOn]);

  // Stop Microphone
  const stopMic = useCallback(() => {
    if (audioStreamRef.current) {
      console.log('Stopping microphone.');
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
    if (videoRef.current) {
      try {
        if (!mediaState.isPipOn) {
          console.log('Entering Picture-in-Picture mode.');
          await videoRef.current.requestPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: true }));
        } else {
          console.log('Exiting Picture-in-Picture mode.');
          await document.exitPictureInPicture();
          setMediaState((prev) => ({ ...prev, isPipOn: false }));
        }
      } catch (err) {
        console.error('Unable to toggle PiP mode.', err);
        alert('Unable to toggle PiP mode.');
        // Optionally, revert the state if PiP action fails
        setMediaState((prev) => ({ ...prev, isPipOn: false }));
      }
    } else {
      console.warn('Video element is not available for PiP.');
    }
  }, [mediaState.isPipOn]);

  // Toggle Memory
  const toggleMem = useCallback(() => {
    setMediaState((prev) => ({ ...prev, isMemOn: !prev.isMemOn }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up media streams and PiP mode.');
      stopCam();
      stopMic();
      if (mediaState.isPipOn) {
        document.exitPictureInPicture().catch((err) => {
          console.error('Error exiting PiP on cleanup.', err);
        });
      }
    };
  }, [mediaState.isPipOn, stopCam, stopMic]);

  // Monitor Microphone Permissions
  useEffect(() => {
    const checkAndMonitorMicPermissions = async () => {
      if (!navigator.permissions) {
        console.warn('Permissions API is not supported in this browser.');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissionStatusRef.current = status;

        // Initial check
        if (status.state === 'denied') {
          console.warn('Microphone access denied.');
          stopMic();
          alert('Microphone access has been denied. Please enable it in your browser settings.');
        }

        // Define the handler
        const handlePermissionChange = () => {
          console.log(`Microphone permission changed to ${status.state}.`);
          if (status.state === 'denied') {
            stopMic();
            alert('Microphone access has been denied. Please enable it in your browser settings.');
          }
        };

        // Store the handler in ref for cleanup
        handlePermissionChangeRef.current = handlePermissionChange;

        // Attach event listener to PermissionStatus
        if (typeof status.addEventListener === 'function') {
          status.addEventListener('change', handlePermissionChange);
        } else if (typeof status.onchange === 'function') {
          status.onchange = handlePermissionChange;
        }
      } catch (err) {
        console.error('Error querying microphone permissions.', err);
      }
    };

    checkAndMonitorMicPermissions();

    return () => {
      if (permissionStatusRef.current && handlePermissionChangeRef.current) {
        const status = permissionStatusRef.current;
        const handlePermissionChange = handlePermissionChangeRef.current;

        if (typeof status.removeEventListener === 'function') {
          status.removeEventListener('change', handlePermissionChange);
        } else if (typeof status.onchange === 'function') {
          status.onchange = null;
        }
      }
    };
  }, [stopMic]);

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
