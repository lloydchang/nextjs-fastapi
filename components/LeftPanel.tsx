// LeftPanel.tsx
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
    isCamOn: false,
    isMicOn: false,
    isPiP: false,
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
        alert("Failed to send message. Please try again.");
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
        startPiP();

        if (!mediaState.isMicOn) startMic();
      }
    } catch (err) {
      alert("Unable to access cam. Please check permissions.");
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
        await videoRef.current.requestPictureInPicture();
        updateMediaState("isPiP", true);
      } catch (err) {
        alert("Unable to enter PiP mode.");
      }
    }
  };

  const stopPiP = async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        updateMediaState("isPiP", false);
      } catch (err) {
        alert("Unable to exit PiP mode.");
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
      alert("Unable to access mic. Please check permissions.");
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
      setMessages((prev) =>
        isFinal
          ? prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript })
          : prev.concat({ sender: "user", text: transcript, isInterim: true })
      );
    },
    [setMessages]
  );

  const { startHearing, stopHearing, isRecognitionRunning } = useSpeechRecognition(handleSpeechResult);

  // Function to start both mic and speech recognition
  const startMicWithSpeechRecognition = useCallback(async () => {
    try {
      await startMic();
      startHearing();
    } catch (err) {
      alert("Unable to access mic. Please check permissions.");
    }
  }, [startMic, startHearing]);

  const stopMicWithSpeechRecognition = useCallback(() => {
    stopHearing();
    stopMic();
  }, [stopHearing, stopMic]);

  const toggleMicWithSpeechRecognition = () =>
    mediaState.isMicOn ? stopMicWithSpeechRecognition() : startMicWithSpeechRecognition();

  useEffect(() => {
    return () => {
      stopCam();
      stopMic();
    };
  }, []);

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
            isRecognitionRunning={isRecognitionRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
