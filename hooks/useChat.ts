// hooks/useChat.ts

const sendActionToChatbot = async (input: string) => {
  setMessages((prev) => [...prev, { sender: "user", text: input }]);
  
  try {
    // Using the updated chat service function
    const responseMessage = await sendMessageToChatbot(systemPrompt, input);
    setMessages((prev) => [...prev, { sender: "TEDxSDG", text: responseMessage }]);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
    ]);
  }
};
