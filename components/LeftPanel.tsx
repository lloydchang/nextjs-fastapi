// src/components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundImage from "../public/TEDxSDG.jpg"; // Import a background image
import { useChat } from "../hooks/useChat"; // Custom hook for chat operations
import VideoStream from "./VideoStream";
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Scroll chat to the bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle key presses in the chat input
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent default behavior (like adding a newline)
      handleChat();
    }
  };

  // Camera and Microphone Handlers
  const startCamera = async () => {
    console.log("Attempting to start camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        await videoRef.current.play();
        setIsCameraOn(true);
        setIsMicrophoneOn(true);
        if (document.pictureInPictureEnabled) {
          await videoRef.current.requestPictureInPicture();
          setIsPiP(true);
        } else {
          alert("Picture-in-Picture is not supported by your browser.");
        }
      }
      console.log("Stream obtained:", stream);
    } catch (err) {
      console.error("Failed to start camera and microphone:", err);
      alert("Unable to access camera and microphone. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setIsCameraOn(false);
      setIsMicrophoneOn(false);
      if (isPiP) {
        document.exitPictureInPicture().catch(err => console.error("Failed to exit PiP:", err));
        setIsPiP(false);
      }
    }
  };

  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicrophoneOn(prev => !prev);
    }
  };

  // Handle Picture-in-Picture (PiP) Changes
  const handlePiPChange = useCallback(() => {
    if (!document.pictureInPictureElement) {
      setIsPiP(false);
    } else {
      setIsPiP(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("enterpictureinpicture", handlePiPChange);
    document.addEventListener("leavepictureinpicture", handlePiPChange);

    return () => {
      document.removeEventListener("enterpictureinpicture", handlePiPChange);
      document.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, [handlePiPChange]);

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Background Image */}
      {showImage && (
        <>
          <Image
            src={BackgroundImage}
            alt="Background"
            fill
            className={styles.backgroundImage}
          />
          <div className={styles.overlay} />
        </>
      )}

      <VideoStream isCameraOn={isCameraOn} videoRef={videoRef} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <b>Ideas Change Everything!</b>
        </h1>

        {/* Chat Interface */}
        <div className={styles.chatInterface} ref={chatContainerRef}>
          <h3 className={styles.chatHeader}>
            <b>Chat with TEDxSDG</b>
          </h3>

          <ChatMessages messages={messages} />

          <ChatInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChat={handleChat}
            handleKeyDown={handleKeyDown}
          />

          <ControlButtons
            isCameraOn={isCameraOn}
            isMicrophoneOn={isMicrophoneOn}
            toggleMicrophone={toggleMicrophone}
            startCamera={startCamera}
            stopCamera={stopCamera}
            isPiP={isPiP}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
