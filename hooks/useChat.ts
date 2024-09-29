import { useState } from "react";
import { Message } from "../types/message";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { sendMessageToChatbot } from "../services/chatService";
import { systemPrompt } from "../utils/systemPrompt";

// Custom hook to manage chat messages and interactions with the chatbot
export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { startHearing, stopHearing, isHearingOn } = useSpeechRecognition();

  const sendActionToChatbot = async (input: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    try {
      const responseMessage = await sendMessageToChatbot(systemPrompt, input);
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: responseMessage }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: "Error occurred. Please try again." }]);
    }
  };

  return { messages, sendActionToChatbot, startHearing, stopHearing, isHearingOn };
};
