// utils/chatUtils.ts

/**
 * Appends a message to the chat window element in the DOM.
 * @param message - The message text to display in the chat window.
 */
export const sendMessageToChat = (message: string) => {
    // Locate the chat window element by its ID
    const chatWindow = document.getElementById('chat-message-window');
  
    // If the element is not found, log an error message to the console
    if (!chatWindow) {
      console.error('Chat window element not found. Ensure that an element with ID "chat-message-window" is present in the DOM.');
      return;
    }
  
    // Create a new paragraph element for the message
    const newMessageElement = document.createElement('p');
    newMessageElement.innerText = message;
  
    // Append the new message element to the chat window
    chatWindow.appendChild(newMessageElement);
  
    // Log the action to the console for debugging
    console.log(`Message sent to chat window: "${message}"`);
  };
  