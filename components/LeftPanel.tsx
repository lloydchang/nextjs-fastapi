// components/LeftPanel.tsx
"use client"; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundImage from "../public/TEDxSDG.jpg"; // Import a background image
// Import your custom hooks and components
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import VideoStream from "./VideoStream";
import AudioStream from "./AudioStream";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ControlButtons from "./ControlButtons";
import styles from "./LeftPanel.module.css";

// For testing, we'll use local state instead of useChat hook
// Remove the following import if you're using useChat in your project
// import { useChat } from "../hooks/useChat";

const LeftPanel: React.FC = () => {
  // Replace useChat hook with local state for testing
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string; isInterim: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [lastFinalMessage, setLastFinalMessage] = useState<string | null>(null);
  const [mediaState, setMediaState] = useState({
    isCamOn: false,
    isMicOn: false,
    isPipOn: false,
    isMemOn: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Define chatContainerRef

  // Mock sendActionToChatbot function
  const sendActionToChatbot = useCallback(async (input: string) => {
    // Simulate a chatbot response after a delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `Echo: ${input}`, isInterim: false },
      ]);
    }, 1000);
  }, []);

  const updateMediaState = (
    key: keyof typeof mediaState,
    value: boolean
  ) => {
    setMediaState((prev) => ({ ...prev, [key]: value }));
  };

  // Handle sending chat messages
  const handleChat = useCallback(
    async (input: string = "") => {
      if (typeof input === "string" && input.trim()) {
        try {
          console.log("Sending message to chatbot:", input);
          // Update the messages state with the new message
          setMessages((prev) => [
            ...prev,
            { sender: "user", text: input, isInterim: false },
          ]);
          setChatInput(""); // Clear input after sending
          await sendActionToChatbot(input);
        } catch (error) {
          console.error("Error sending message:", error);
          alert("Failed to send message. Please try again.");
        }
      } else {
        console.warn("Input is empty or invalid");
      }
    },
    [sendActionToChatbot]
  );

  // Handle camera operations
  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        updateMediaState("isCamOn", true);
        await startPip();

        if (!mediaState.isMicOn) await startMic();
      }
    } catch (err) {
      alert("Unable to access cam. Please check permissions.");
    }
  };

  const stopCam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    updateMediaState("isCamOn", false);
    stopPip();
  };

  // Handle Picture-in-Picture (PiP) operations
  const startPip = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement !== videoRef.current) {
          await videoRef.current.requestPictureInPicture();
          updateMediaState("isPipOn", true);
        }
      } catch (err) {
        console.error("Unable to enter PiP mode:", err);
        alert("Unable to enter PiP mode.");
      }
    }
  };

  const stopPip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        updateMediaState("isPipOn", false);
      }
    } catch (err) {
      console.error("Unable to exit PiP mode:", err);
      alert("Unable to exit PiP mode.");
    }
  };

  // Handle microphone operations
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        await audioRef.current.play();
        updateMediaState("isMicOn", true);
      }
    } catch (err) {
      alert("Unable to access mic. Please check permissions.");
    }
  };

  const stopMic = () => {
    if (audioRef.current && audioRef.current.srcObject) {
      const stream = audioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      audioRef.current.srcObject = null;
    }
    updateMediaState("isMicOn", false);
  };

  const toggleMic = () => {
    mediaState.isMicOn ? stopMic() : startMic();
  };

  // Handle speech recognition results
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      setMessages((prev) => {
        const existingInterimIndex = prev.findIndex((msg) => msg.isInterim);

        if (isFinal) {
          if (transcript !== lastFinalMessage) {
            const updatedMessages =
              existingInterimIndex > -1
                ? prev
                    .filter((_, index) => index !== existingInterimIndex)
                    .concat({
                      sender: "user",
                      text: transcript,
                      isInterim: false,
                    })
                : [
                    ...prev,
                    { sender: "user", text: transcript, isInterim: false },
                  ];

            if (mediaState.isMemOn) {
              const memory = localStorage.getItem("speechMemory") || "";
              localStorage.setItem("speechMemory", memory + transcript + " ");
            }

            console.log("Sending transcribed speech to chatbot:", transcript);
            handleChat(transcript);
            setLastFinalMessage(transcript);
            return updatedMessages;
          } else {
            return prev;
          }
        } else {
          if (existingInterimIndex > -1) {
            return prev.map((msg, index) =>
              index === existingInterimIndex
                ? { sender: "user", text: transcript, isInterim: true }
                : msg
            );
          } else {
            return [
              ...prev,
              { sender: "user", text: transcript, isInterim: true },
            ];
          }
        }
      });
    },
    [setMessages, mediaState.isMemOn, handleChat, lastFinalMessage]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(
    handleSpeechResult
  );

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
    mediaState.isMicOn
      ? stopMicWithSpeechRecognition()
      : startMicWithSpeechRecognition();

  const toggleMem = () =>
    updateMediaState("isMemOn", !mediaState.isMemOn);

  useEffect(() => {
    return () => {
      stopCam();
      stopMic();
    };
  }, []);

  return (
    <div className={styles.container}>
      <Image
        src={BackgroundImage}
        alt="Background"
        fill
        className={styles.backgroundImage}
      />
      <div className={styles.overlay} />

      {/* VideoStream with conditional styles based on isPipOn */}
      <div
        className={
          mediaState.isPipOn
            ? styles.videoStreamHidden
            : styles.videoStream
        }
      >
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
          <ChatInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChat={handleChat}
          />

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
