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
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(false);
  const [isPiP, setIsPiP] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null); // Ref for AudioStream
  const chatContainerRef = useRef<HTMLDivElement>(null); // Reference for chat container
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Handle sending chat messages
  const handleChat = useCallback(async () => {
    console.log("Sending message:", chatInput);
    if (chatInput.trim() !== "") {
      try {
        await sendActionToChatbot(chatInput);
        console.log("Message sent successfully");
        setChatInput("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  }, [chatInput, sendActionToChatbot]);

  // Handle key presses in the chat input
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log("Key pressed:", event.key);
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChat();
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    console.log("Starting camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setIsCameraOn(true);
        console.log("Camera started successfully");
        startPiP();

        if (!isMicrophoneOn) {
          console.log("Microphone is off, starting microphone...");
          await startMicrophone(); // Start the microphone if it's not already on
        }
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera...");
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
      setIsCameraOn(false);
      console.log("Camera stopped");
      if (isPiP) {
        document.exitPictureInPicture().catch(err => console.error("Failed to exit PiP:", err));
        setIsPiP(false);
        console.log("Exited Picture-in-Picture mode");
      }
    }
  };

  const startPiP = async () => {
    console.log("Starting Picture-in-Picture...");
    if (videoRef.current) {
      try {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
        console.log("Entered Picture-in-Picture mode");
      } catch (err) {
        console.error("Failed to enter PiP:", err);
        alert("Unable to enter PiP mode.");
      }
    }
  };

  const stopPiP = async () => {
    console.log("Exiting Picture-in-Picture...");
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        setIsPiP(false);
        console.log("Exited Picture-in-Picture mode");
      } catch (err) {
        console.error("Failed to exit PiP:", err);
        alert("Unable to exit PiP mode.");
      }
    }
  };

  // Microphone Handlers
  const startMicrophone = async () => {
    console.log("Starting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        setIsMicrophoneOn(true);
        console.log("Microphone started successfully");
      }
    } catch (err) {
      console.error("Failed to start microphone:", err);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopMicrophone = () => {
    console.log("Stopping microphone...");
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      setIsMicrophoneOn(false);
      console.log("Microphone stopped");
    }
  };

  const toggleMicrophone = () => {
    console.log("Toggling microphone. Current state:", isMicrophoneOn);
    if (isMicrophoneOn) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  useEffect(() => {
    console.log("LeftPanel component mounted");
    return () => {
      console.log("Cleaning up resources before unmounting...");
      stopCamera();
      stopMicrophone();
      console.log("Resources cleaned up successfully");
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

      <VideoStream isCameraOn={isCameraOn} isPiP={isPiP} videoRef={videoRef} />
      <AudioStream isMicrophoneOn={isMicrophoneOn} audioRef={audioRef} />

      <div className={styles.content}>
        <h1 className={styles.title}><b>Ideas Change Everything!</b></h1>

        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}><b>Chat with TEDxSDG</b></h3>

          <ChatMessages messages={messages} />

          <ChatInput chatInput={chatInput} setChatInput={setChatInput} handleChat={handleChat} handleKeyDown={handleKeyDown} />

          <ControlButtons
            isCameraOn={isCameraOn}
            isMicrophoneOn={isMicrophoneOn}
            toggleMicrophone={toggleMicrophone}
            startCamera={startCamera}
            stopCamera={stopCamera}
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
