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
        await sendActionToChatbot(chatInput);
        setChatInput("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  }, [chatInput, sendActionToChatbot]);

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
        const updatedMessages = isFinal
          ? prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript, isInterim: false })
          : prev.filter((msg) => !msg.isInterim).concat({ sender: "user", text: transcript, isInterim: true });

        // If memory is enabled, save the final result to local storage
        if (mediaState.isMemOn && isFinal) {
          const memory = localStorage.getItem("speechMemory") || "";
          localStorage.setItem("speechMemory", memory + transcript + " ");
        }

        return updatedMessages;
      });
    },
    [setMessages, mediaState.isMemOn]
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

      {/* VideoStream is always rendered to maintain its state */}
      <VideoStream isCamOn={mediaState.isCamOn} isPipOn={mediaState.isPipOn} videoRef={videoRef} />
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
            startPip={startPip} // Updated to new function name
            stopPip={stopPip} // Updated to new function name
            isPipOn={mediaState.isPipOn} // Updated variable name
            isMemOn={mediaState.isMemOn} // Pass memory state
            toggleMem={toggleMem} // Pass toggle function for memory
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
