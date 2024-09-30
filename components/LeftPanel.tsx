// components/LeftPanel.tsx
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
    isPipOn: false, // Updated variable name
    isMemOn: false, // Memory state
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
        console.log("Sending message to chatbot:", chatInput); // Log the message being sent
        await sendActionToChatbot(chatInput);
        setChatInput("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  }, [chatInput, sendActionToChatbot]);

  // Handle microphone speech recognition results
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      setMessages((prev) => {
        const updatedMessages = isFinal
          ? prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript, isInterim: false })
          : prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript, isInterim: true });

        // If memory is enabled, save the final result to local storage
        if (mediaState.isMemOn && isFinal) {
          const memory = localStorage.getItem("speechMemory") || "";
          localStorage.setItem("speechMemory", memory + transcript + " ");
        }

        // Automatically send the message to the chatbot if the speech result is final
        if (isFinal) {
          setChatInput(transcript); // Set chat input to the transcript
          handleChat(); // Call the handleChat function to send the message
        }

        return updatedMessages;
      });
    },
    [setMessages, mediaState.isMemOn, handleChat]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(handleSpeechResult);

  // ... (rest of the code remains unchanged)

  return (
    <div className={styles.container}>
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />

      {/* VideoStream with conditional styles based on isPipOn */}
      <div className={mediaState.isPipOn ? styles.videoStreamHidden : styles.videoStream}>
        <VideoStream
          isCamOn={mediaState.isCamOn}
          videoRef={videoRef}
        />
      </div>
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
            startPip={startPip}
            stopPip={stopPip}
            isPipOn={mediaState.isPipOn}
            isMemOn={mediaState.isMemOn}
            toggleMem={toggleMem}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
