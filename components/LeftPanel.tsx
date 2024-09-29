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

  // Camera Handlers
  const startCamera = async () => {
    console.log("Attempting to start camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        setIsCameraOn(true);
        console.log("Video stream obtained:", stream);

        // Attempt to start PiP mode automatically
        startPiP();
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
      setIsCameraOn(false);
      console.log("Camera stopped");

      if (isPiP) {
        document.exitPictureInPicture().catch(err => console.error("Failed to exit PiP:", err));
        setIsPiP(false);
      }
    }
  };

  // Function to start PiP
  const startPiP = async () => {
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

  // Function to stop PiP
  const stopPiP = async () => {
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

  // Microphone Handlers moved to AudioStream component
  const startMicrophone = async () => {
    console.log("Attempting to start microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioStreamRef.current = stream;
        await audioRef.current.play();
        setIsMicrophoneOn(true);
        console.log("Audio stream obtained:", stream);
      }
    } catch (err) {
      console.error("Failed to start microphone:", err);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopMicrophone = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      setIsMicrophoneOn(false);
      console.log("Microphone stopped");
    }
  };

  const toggleMicrophone = () => {
    if (isMicrophoneOn) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  // Handle Picture-in-Picture (PiP) Changes
  useEffect(() => {
    const handlePiPChange = () => {
      if (!document.pictureInPictureElement) {
        setIsPiP(false);
        console.log("Exited Picture-in-Picture mode");
      } else {
        setIsPiP(true);
        console.log("Entered Picture-in-Picture mode");
      }
    };

    document.addEventListener("enterpictureinpicture", handlePiPChange);
    document.addEventListener("leavepictureinpicture", handlePiPChange);

    return () => {
      document.removeEventListener("enterpictureinpicture", handlePiPChange);
      document.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, []);

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopMicrophone();
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

      {/* Pass isPiP to VideoStream */}
      <VideoStream isCameraOn={isCameraOn} isPiP={isPiP} videoRef={videoRef} />

      {/* AudioStream Component */}
      <AudioStream isMicrophoneOn={isMicrophoneOn} audioRef={audioRef} />

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
            startPiP={startPiP} // Pass the startPiP function as a prop
            stopPiP={stopPiP}   // Pass the stopPiP function as a prop
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
