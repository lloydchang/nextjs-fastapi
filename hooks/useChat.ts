// src/hooks/useChat.ts

import { useState, useEffect, useRef } from "react";

// Define the interface for message structure
interface Message {
  sender: string;
  text: string;
}

// Custom hook to manage chat messages and interactions with the chatbot
export const useChat = () => {
  // State to keep track of all chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHearingOn, setIsHearingOn] = useState(false); // State to control the hearing status
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false); // Track if recognition is already running
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Reference to the SpeechRecognition instance

  // Expanded system prompt for the chatbot to set the context and role
  const systemPrompt = `
    You are TEDxSDG, an AI-powered assistant designed to help individuals and teams turn inspirational ideas into impactful business plans, aligned with the United Nations Sustainable Development Goals (SDGs). 
    You act as a strategic partner, providing users with actionable roadmaps, market insights, and guidance to help bridge the gap between ideation and implementation.

    Your role is to support users by:
    1. Mapping their project goals to relevant SDGs and identifying areas of potential impact.
    2. Providing contextualized recommendations based on real-world data and SDG progress.
    3. Leveraging AI insights to create structured, scalable, and sustainable roadmaps.
    4. Guiding users through strategic planning, funding acquisition, and resource management.
    5. Assisting with creating grant applications, investor pitch decks, and impact assessments.

    Here are two personas you might interact with:
    **Personas**:
    1. **Sam**: A dedicated veterinarian focusing on eco-friendly pet care aligned with SDGs 3 (Good Health and Well-being) and 15 (Life on Land). 
       - **Background**: Sam runs a small animal clinic and wants to incorporate sustainable practices into the business model. The goal is to reduce the carbon footprint of veterinary care through initiatives like eco-friendly pet products, zero-waste packaging, and organic pet food.
       - **Challenges**: Sam faces difficulties in understanding how to measure and track the environmental impact of these initiatives. There are also challenges with finding the right funding and suppliers for sustainable products.
       - **Needs**: Guidance on creating a detailed business plan, recommendations on sustainable suppliers, funding sources, and tools for tracking the impact on SDG metrics.
       - **Goals**: Sam wants to expand these eco-friendly services while ensuring they are cost-effective and contribute meaningfully to SDGs 3 and 15.
       - **Expected Outcomes**: A roadmap for integrating sustainable practices, funding proposals for implementing eco-friendly initiatives, and a set of metrics to measure the environmental impact of the clinic.

    2. **Alex**: A visionary restaurateur envisioning sustainable supply chains that support SDG 2 (Zero Hunger).
       - **Background**: Alex owns a local restaurant chain and aims to revamp the entire supply chain to minimize food waste, source from local farmers, and create community programs to combat hunger.
       - **Challenges**: Alex finds it difficult to navigate complex regulations for sustainable food sourcing and struggles to identify the right partners for scaling the vision.
       - **Needs**: AI support in developing a comprehensive supply chain transformation strategy, access to data on local food systems, and tools for finding grant opportunities and sustainability certifications.
       - **Goals**: Alex wants to create a sustainable supply chain that prioritizes local farmers and reduces food waste, while keeping costs manageable.
       - **Expected Outcomes**: A step-by-step strategy to transform supply chains, a list of sustainable suppliers, grant proposals to support the transition, and metrics for tracking SDG 2 progress.

    **Core Functionality**:
    1. **AI Agent for Live Interactions**: Engage with users in real-time to answer questions, offer advice, and provide personalized guidance based on their project objectives.
    2. **Actionable Roadmaps**: Generate detailed plans that guide users step-by-step through the implementation process. Each roadmap should include tasks, resources, and expected outcomes tied to SDG indicators.
    3. **Finding Funding**: Use AI to help users discover funding opportunities, generate customized grant applications, and create compelling investor pitches.

    **Supporting Features**:
    1. **Data Integration**: Analyze TEDx talks to extract themes and map these to regional/global SDG progress. Use datasets like UN SDG Indicators, World Bank Open Data, and UNDP Human Development Reports to identify opportunities and contextualize user goals.
    2. **Grant Writing**: Provide users with AI-generated drafts for grant proposals, aligning them with specific SDG targets and metrics.
    3. **Tracking and Impact Metrics**: Offer tools for measuring project success through northstar metrics that highlight contributions to specific SDG goals.
    
    As TEDxSDG, your mission is to turn inspiration into actionable strategies for global change—helping users like Sam and Alex build impactful, data-driven, and sustainable businesses.
  `;

  // Function to handle sending messages to the chatbot
  const sendActionToChatbot = async (input: string) => {
    // Append the user message to the chat
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      // Prepare request to chatbot backend with system prompt, user input, and temperature setting
      const requestBody = { 
        model: "llama3.2", 
        prompt: `${systemPrompt}\nUser: ${input}\nAssistant:`,
        temperature: 2.0 // Set the temperature to control response randomness and creativity
      };
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Handle non-200 HTTP status codes
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      // Variable to keep track of the chatbot message index in the state
      let chatbotMessageIndex: number;

      // Append a placeholder for the chatbot's response
      setMessages((prev) => {
        chatbotMessageIndex = prev.length;
        return [...prev, { sender: "TEDxSDG", text: "" }];
      });

      // Use streams to read the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      // Parse the streaming response and update the message text
      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean); // Split response into lines

        // Iterate through each line and update the message state accordingly
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed.response) {
              setMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages[chatbotMessageIndex] = {
                  ...updatedMessages[chatbotMessageIndex],
                  text: (updatedMessages[chatbotMessageIndex].text + parsed.response).trim(),
                };
                return updatedMessages;
              });
            }
            // Mark as done if the response indicates completion
            if (parsed.done) done = true;
          } catch (e) {
            console.error("Failed to parse line: ", line);
          }
        }
        if (streamDone) break; // Exit loop if stream is finished
      }
    } catch (error) {
      console.error("Error occurred: ", error);
      // Display error message if request fails
      setMessages((prev) => [
        ...prev,
        { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  // Function to start hearing using the Web Speech API
  const startHearing = () => {
    if (recognitionRef.current && !isRecognitionRunning) {
      recognitionRef.current.start();
      setIsHearingOn(true);
      setIsRecognitionRunning(true); // Set the recognition running flag
    }
  };

  // Function to stop hearing
  const stopHearing = () => {
    if (recognitionRef.current && isRecognitionRunning) {
      recognitionRef.current.stop();
      setIsHearingOn(false);
      setIsRecognitionRunning(false); // Reset the recognition running flag
    }
  };

  // Set up the SpeechRecognition instance
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Initialize new SpeechRecognition instance and configure settings
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true; // Enable continuous listening mode
      recognition.interimResults = true; // Get partial results as the user speaks
      recognition.lang = "en-US"; // Set language to English

      // Handler for speech recognition results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            // Append final transcript to messages
            setMessages((prev) => [...prev, { sender: "user", text: event.results[i][0].transcript }]);
          } else {
            // Update interim transcript
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update last message with interim transcript
        if (interimTranscript) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { sender: "user", text: interimTranscript },
          ]);
        }
      };

      // Handler for recognition end event
      recognition.onend = () => {
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the recognition running flag on end
      };

      // Handler for recognition error event
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the flag on error
      };
    } else {
      console.error("SpeechRecognition API is not supported in this browser.");
    }
  }, []);

  // Return state and handlers for external use
  return { messages, sendActionToChatbot, startHearing, stopHearing, isHearingOn };
};
