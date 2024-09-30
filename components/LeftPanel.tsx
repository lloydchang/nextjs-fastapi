"use client"; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundImage from "../public/TEDxSDG.jpg"; // Import a background image
import { useChat } from "../hooks/useChat"; // Custom hook for chat operations
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"; // Import speech recognition hook
import VideoStream from "./VideoStream";
import AudioStream from "./AudioStream"; // Import the AudioStream component
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ControlButtons from "./ControlButtons";
import styles from "./LeftPanel.module.css"; // Import CSS module for styling

const LeftPanel: React.FC = () => {
  const { messages, setMessages, sendActionToChatbot } = useChat();

  const [chatInput, setChatInput] = useState<string>("");
  const [mediaState, setMediaState] = useState({
    isCamOn: true, // Enable camera by default
    isMicOn: true, // Enable microphone by default
    isPiP: true,  // Enable PiP by default
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const updateMediaState = (key: keyof typeof mediaState, value: boolean) => {
    setMediaState((prev) => ({ ...prev, [key]: value }));
  };

  // Handle sending chat messages
  const handleChat = useCallback(async () => {
    if (chatInput.trim()) {
      try {
        await sendActionToChatbot(chatInput);
        setChatInput("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }, [chatInput, sendActionToChatbot]);

  // Handle cam and PiP toggling
  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        updateMediaState("isCamOn", true);
        await startPiP();

        if (!mediaState.isMicOn) await startMic();
      }
    } catch (err) {
      console.error("Unable to access camera:", err);
    }
  };

  const stopCam = () => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    updateMediaState("isCamOn", false);
    stopPiP();
  };

  const startPiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement !== videoRef.current) {
          await videoRef.current.requestPictureInPicture();
          updateMediaState("isPiP", true);
        }
      } catch (err) {
        console.error("Unable to enter PiP mode:", err);
      }
    }
  };

  const stopPiP = async () => {
    if (document.pictureInPictureElement) {
      try {
        if (document.pictureInPictureElement === videoRef.current) {
          await document.exitPictureInPicture();
          updateMediaState("isPiP", false);
        }
      } catch (err) {
        console.error("Unable to exit PiP mode:", err);
      }
    }
  };

  // Handle microphone operations
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        updateMediaState("isMicOn", true);
      }
    } catch (err) {
      console.error("Unable to access microphone:", err);
    }
  };

  const stopMic = () => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    updateMediaState("isMicOn", false);
  };

  const toggleMic = () => (mediaState.isMicOn ? stopMic() : startMic());

  // Handle speech recognition results
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      setMessages((prev) => {
        if (!isFinal && prev.some((msg) => msg.text === transcript && msg.isInterim)) {
          return prev; // Prevent duplicates if similar interim message exists
        }
        return isFinal
          ? prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript })
          : [...prev.filter((msg) => msg.isInterim), { sender: "user", text: transcript, isInterim: true }];
      });
    },
    [setMessages]
  );

  const { startHearing, stopHearing, isRecognitionRunning } = useSpeechRecognition(handleSpeechResult);

  // Function to start both mic and speech recognition
  const startMicWithSpeechRecognition = useCallback(async () => {
    try {
      setMessages([]); // Clear previous messages to avoid overlap
      await startMic();
      startHearing();
    } catch (err) {
      console.error("Unable to start microphone and speech recognition:", err);
    }
  }, [startMic, startHearing, setMessages]);

  const stopMicWithSpeechRecognition = useCallback(() => {
    stopHearing();
    stopMic();
  }, [stopHearing, stopMic]);

  const toggleMicWithSpeechRecognition = () =>
    mediaState.isMicOn ? stopMicWithSpeechRecognition() : startMicWithSpeechRecognition();

  // Automatically enable camera, microphone, and PiP when the component mounts
  useEffect(() => {
    startCam();
    startMicWithSpeechRecognition();
    return () => {
      stopCam();
      stopMic();
      setMessages([]); // Clean up messages state on unmount
    };
  }, [startMicWithSpeechRecognition]);

  return (
    <div className={styles.container}>
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      <VideoStream isCamOn={mediaState.isCamOn} isPiP={mediaState.isPiP} videoRef={videoRef} />
      <AudioStream isMicOn={mediaState.isMicOn} audioRef={audioRef} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <b>Ideas Change Everything!</b>
        </h1>
        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}>
            <b>Chat with TEDxSDG</b>
          </h3>

          <ChatMessages messages={messages} />
          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} />

          <ControlButtons
            isCamOn={mediaState.isCamOn}
            isMicOn={mediaState.isMicOn}
            toggleMic={toggleMicWithSpeechRecognition}
            startCam={startCam}
            stopCam={stopCam}
            startPiP={startPiP}
            stopPiP={stopPiP}
            isPiP={mediaState.isPiP}
            isRecognitionRunning={isRecognitionRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
