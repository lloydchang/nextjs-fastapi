// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundImage from "../public/TEDxSDG.jpg"; // Import a background image
import { useChat } from "../hooks/useChat"; // Custom hook for chat operations
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"; // Import speech recognition hook
import VideoStream from "./VideoStream";
import AudioStream from "./AudioStream"; // Import the AudioStream component
import ChatInput from "./ChatInput"; // Import the ChatInput component
import ChatMessages from "./ChatMessages";
import ControlButtons from "./ControlButtons";
import styles from "./LeftPanel.module.css"; // Import CSS module for styling

const LeftPanel: React.FC = () => {
  const { messages, setMessages, sendActionToChatbot } = useChat();

  const [chatInput, setChatInput] = useState<string>(""); // Keep chatInput state
  const [mediaState, setMediaState] = useState({
    isCamOn: false,
    isMicOn: false,
    isPipOn: false,
    isMemOn: false,
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
  const handleChat = useCallback(async (input: string) => {
    if (input.trim()) {
      try {
        console.log("Sending message to chatbot:", input); // Log the message being sent
        await sendActionToChatbot(input);
        setChatInput(""); // Clear input after sending
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  }, [sendActionToChatbot]);

  // Handle cam and Pip toggling
  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
        await videoRef.current.play();
        updateMediaState("isCamOn", true);
        startPip(); // Start PiP after the camera is on

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
    stopPip(); // Ensure PiP is stopped when camera is off
  };

  const startPip = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement !== videoRef.current) {
          await videoRef.current.requestPictureInPicture();
          updateMediaState("isPipOn", true); // Update state
        }
      } catch (err) {
        console.error("Unable to enter Pip mode:", err);
        alert("Unable to enter Pip mode.");
      }
    }
  };

  const stopPip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updateMediaState("isPipOn", false); // Update state to reflect PiP is off
      }
    } catch (err) {
      console.error("Unable to exit Pip mode:", err);
      alert("Unable to exit Pip mode.");
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

  // Updated handleSpeechResult function
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      setMessages((prev) => {
        const existingInterim = prev.find(msg => msg.isInterim && msg.text === transcript);

        // If it's final, clear out interim messages and add the final message
        if (isFinal) {
          const updatedMessages = prev.filter(msg => !msg.isInterim).concat({ sender: "user", text: transcript, isInterim: false });

          // If memory is enabled, save the final result to local storage
          if (mediaState.isMemOn) {
            const memory = localStorage.getItem("speechMemory") || "";
            localStorage.setItem("speechMemory", memory + transcript + " ");
          }

          // Automatically send the message to the chatbot
          console.log("Sending transcribed speech to chatbot:", transcript); // Log the transcribed speech
          handleChat(transcript); // Directly send the transcript to the chatbot
          return updatedMessages;
        } else if (!existingInterim) { 
          // If interim and not a duplicate, append to messages
          return [...prev, { sender: "user", text: transcript, isInterim: true }];
        }

        return prev; // Return previous state if no updates are needed
      });
    },
    [setMessages, mediaState.isMemOn, handleChat]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(handleSpeechResult);

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

  const toggleMem = () => updateMediaState("isMemOn", !mediaState.isMemOn); // Toggle memory state

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

      {/* VideoStream with conditional styles based on isPipOn */}
      <div className={mediaState.isPipOn ? styles.videoStreamHidden : styles.videoStream}>
        <VideoStream isCamOn={mediaState.isCamOn} videoRef={videoRef} />
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
