// src/components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundImage from "../public/TEDxSDG.jpg"; // Import a background image
import { useChat } from "../hooks/useChat"; // Custom hook for chat operations
import VideoStream from "./VideoStream";
import AudioStream from "./AudioStream"; // Import the new AudioStream component
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ControlButtons from "./ControlButtons";
import styles from "./LeftPanel.module.css"; // Import CSS module for styling

const LeftPanel: React.FC = () => {
  const { messages, sendActionToChatbot } = useChat();

  const [showImage, setShowImage] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>("");
  const [isCamOn, setIsCamOn] = useState<boolean>(false); // Use `isCamOn` instead of `isCameraOn`
  const [isMicOn, setIsMicOn] = useState<boolean>(false); // Use `isMicOn` instead of `isMicrophoneOn`
  const [isPiP, setIsPiP] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Handle sending chat messages
  const handleChat = useCallback(async () => {
    if (chatInput.trim() !== "") {
      try {
        await sendActionToChatbot(chatInput);
        setChatInput("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  }, [chatInput, sendActionToChatbot]);

  // Handle key presses in the chat input
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChat();
    }
  };

  // Cam Handlers
  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setIsCamOn(true);
        startPiP();

        if (!isMicOn) {
          await startMic(); // Start Mic if it's not already on
        }
      }
    } catch (err) {
      alert("Unable to access cam. Please check permissions.");
    }
  };

  const stopCam = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
      setIsCamOn(false);
      if (isPiP) {
        document.exitPictureInPicture().catch(err => console.error("Failed to exit PiP:", err));
        setIsPiP(false);
      }
    }
  };

  const startPiP = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } catch (err) {
        alert("Unable to enter PiP mode.");
      }
    }
  };

  const stopPiP = async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } catch (err) {
        alert("Unable to exit PiP mode.");
      }
    }
  };

  // Mic Handlers
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        setIsMicOn(true);
      }
    } catch (err) {
      alert("Unable to access mic. Please check permissions.");
    }
  };

  const stopMic = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      setIsMicOn(false);
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
    } else {
      startMic();
    }
  };

  useEffect(() => {
    return () => {
      stopCam();
      stopMic();
    };
  }, []);

  return (
    <div className={styles.container}>
      {showImage && (
        <>
          <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
          <div className={styles.overlay} />
        </>
      )}

      <VideoStream isCamOn={isCamOn} isPiP={isPiP} videoRef={videoRef} />
      <AudioStream isMicOn={isMicOn} audioRef={audioRef} />

      <div className={styles.content}>
        <h1 className={styles.title}><b>Ideas Change Everything!</b></h1>

        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}><b>Chat with TEDxSDG</b></h3>

          <ChatMessages messages={messages} />

          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} handleKeyDown={handleKeyDown} />

          <ControlButtons
            isCamOn={isCamOn}
            isMicOn={isMicOn}
            toggleMic={toggleMic}
            startCam={startCam}
            stopCam={stopCam}
            isPiP={isPiP}
            startPiP={startPiP}
            stopPiP={stopPiP}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
