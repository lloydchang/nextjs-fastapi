// File: components/state/hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isInterim?: boolean;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory';
  const { getItem, setItem, removeItem } = useLocalStorage(LOCAL_STORAGE_KEY);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>(""); // Track the current query from the server
  const [queryType, setQueryType] = useState<"news" | "data" | "talk">("news"); // Type of search to perform
  const [queryTypeHistory, setQueryTypeHistory] = useState<("news" | "data" | "talk")[]>([]); // Track query type history for rotation
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const messageQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMemOn) {
      const storedMessages = getItem();
      if (storedMessages) {
        setMessages(storedMessages);
        console.log('useChat - Chat history loaded from memory:', storedMessages);
      }
    } else {
      setMessages([]);
      console.log('useChat - Memory is off. Chat history cleared.');
    }
  }, [isMemOn, getItem]);

  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      setItem(messages);
      console.log('useChat - Chat history saved to memory:', messages);
    }
  }, [messages, isMemOn, setItem]);

  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    console.log('useChat - Starting to process the message queue.');

    while (messageQueueRef.current.length > 0) {
      const nextMessage = messageQueueRef.current.shift();
      if (nextMessage) {
        console.log('useChat - Sending next message from queue:', nextMessage);
        await sendMessage(nextMessage);
      }
    }

    isProcessingRef.current = false;
    console.log('useChat - Message queue processing complete.');
  }, []);

  const performSearchWithRetry = async (
    searchFunction: (query: string) => Promise<string>,
    query: string,
    maxRetries: number = 3
  ): Promise<string> => {
    let attempt = 0;
    let result = "";
    while (attempt < maxRetries) {
      try {
        console.log(`useChat - Attempt ${attempt + 1} for query "${query}"`);
        result = await searchFunction(query);
        console.log(`useChat - Successful search on attempt ${attempt + 1}`);
        break;
      } catch (error) {
        attempt++;
        console.error(`useChat - Error on attempt ${attempt} for query "${query}":`, {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
        if (attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.log(`useChat - Retrying in ${backoffTime / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          console.error(`useChat - Exceeded maximum retries for query "${query}"`);
        }
      }
    }
    return result;
  };

  const performNewsSearch = async (query: string): Promise<string> => {
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}`;
    try {
      console.log(`useChat - Performing news search with URL: ${searchUrl}`);
      const response = await fetch(searchUrl);
      console.log('useChat - News search response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      if (!response.ok) throw new Error(`News search failed: ${response.statusText}`);
      const searchResults = await response.text();
      return searchResults;
    } catch (error) {
      console.error('useChat - Error performing news search:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      return "No results found.";
    }
  };

  const performDataSearch = async (query: string): Promise<string> => {
    const searchUrl = `https://unstats.un.org/UNSDWebsite/undatacommons/search?q=${encodeURIComponent(query)}`;
    try {
      console.log(`useChat - Performing data search with URL: ${searchUrl}`);
      const response = await fetch(searchUrl);
      console.log('useChat - Data search response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      if (!response.ok) throw new Error(`Data search failed: ${response.statusText}`);
      const searchResults = await response.json();
      const formattedResults = searchResults.items.map((item: any) => `${item.title} - ${item.description}`).join('\n');
      return formattedResults;
    } catch (error) {
      console.error('useChat - Error performing data search:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      return "No results found.";
    }
  };

  const performTalkSearch = async (query: string): Promise<string> => {
    const searchUrl = `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`;
    try {
      console.log(`useChat - Performing talk search with URL: ${searchUrl}`);
      const response = await fetch(searchUrl);
      console.log('useChat - Talk search response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      if (!response.ok) throw new Error(`Talk search failed: ${response.statusText}`);
      const searchResults = await response.json();
      const formattedResults = searchResults.items.map((item: any) => `${item.title} - ${item.description}`).join('\n');
      return formattedResults;
    } catch (error) {
      console.error('useChat - Error performing talk search:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      return "No results found.";
    }
  };

  const sendMessage = useCallback(
    async (input: string) => {
      const newMessageId = `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);
      console.log(`useChat - Added user message to state:`, { id: newMessageId, text: input });

      try {
        const messagesArray = messagesRef.current.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
        messagesArray.push({ role: 'user', content: input.trim() });

        const requestBody = { messages: messagesArray };
        const requestHeaders = {
          'Content-Type': 'application/json',
          // Add any additional headers if necessary
        };

        console.log('useChat - Sending POST request to /api/chat', {
          url: '/api/chat',
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });

        console.log('useChat - Received response from /api/chat', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('useChat - Server responded with an error', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
          });
          throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }

        const serverResponse = await response.json();
        console.log('useChat - Parsed server response:', serverResponse);

        setCurrentQuery(serverResponse.nextQuery);
        setQueryType(serverResponse.queryType || 'news');
        return serverResponse.nextQuery;
      } catch (error) {
        console.error('useChat - Error generating content from API:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
        // Optionally, you can throw the error to let the caller handle it
        throw error;
      }
    },
    [getConversationContext]
  );

  const startReasoningLoop = useCallback(async () => {
    setIsThinking(true);
    console.log('useChat - Reasoning loop started.');
    let iteration = 0;
    while (iteration < 5) { // Set a limit for iterations to prevent infinite loops
      console.log(`useChat - Reasoning loop iteration ${iteration + 1}`);
      if (queryTypeHistory.includes(queryType)) {
        setQueryType((prev) => {
          const nextIndex = (queryTypeHistory.length + 1) % 3;
          const nextType = ["news", "data", "talk"][nextIndex] as "news" | "data" | "talk";
          console.log(`useChat - Rotating query type from "${prev}" to "${nextType}"`);
          return nextType;
        });
      }

      setQueryTypeHistory((prev) => {
        const updatedHistory = [...prev, queryType].slice(-3);
        console.log('useChat - Updated query type history:', updatedHistory);
        return updatedHistory;
      });

      let searchResults = "";
      switch (queryType) {
        case "news":
          searchResults = await performSearchWithRetry(performNewsSearch, currentQuery);
          break;
        case "data":
          searchResults = await performSearchWithRetry(performDataSearch, currentQuery);
          break;
        case "talk":
          searchResults = await performSearchWithRetry(performTalkSearch, currentQuery);
          break;
      }

      console.log(`useChat - Search results for query type "${queryType}":`, searchResults);

      const nextQuery = await sendMessage(`${queryType} search results: ${searchResults}`);
      setCurrentQuery(nextQuery || "");
      console.log(`useChat - Updated currentQuery to: "${nextQuery}"`);

      iteration++;
    }

    setIsThinking(false);
    console.log('useChat - Reasoning loop completed.');
  }, [currentQuery, performNewsSearch, performDataSearch, performTalkSearch, queryType, queryTypeHistory, sendMessage]);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      removeItem();
      console.log('useChat - Chat history cleared from memory.');
    } catch (error) {
      console.error('useChat - Failed to clear chat history from memory:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  }, [removeItem]);

  return { messages, setMessages, sendMessage, startReasoningLoop, isThinking, clearChatHistory };
};

export function parseIncomingMessage(jsonString: string) {
  try {
    const sanitizedString = jsonString.replace(/\\'/g, "'").replace(/\\"/g, '"');
    const parsedData = JSON.parse(sanitizedString);

    if (!parsedData.persona || !parsedData.message) {
      console.error(`useChat - Incomplete message data received: ${sanitizedString}`);
      return null;
    }

    return parsedData;
  } catch (error) {
    logDetailedErrorInfo(jsonString, error as Error);
    return null;
  }
}

function logDetailedErrorInfo(jsonString: string, error: Error) {
  console.error(`useChat - Error Type: ${error.name}`);
  console.error(`useChat - Error Message: ${error.message}`);
  const snippetLength = 100;
  const startSnippet = jsonString.slice(0, snippetLength);
  const endSnippet = jsonString.slice(-snippetLength);

  console.error('useChat - JSON Snippet (Start):', startSnippet);
  console.error('useChat - JSON Snippet (End):', endSnippet);

  if (jsonString.trim().endsWith('"')) {
    console.error('useChat - Possible Issue: Unterminated string (ends with a double-quote).');
  } else if (jsonString.includes('undefined')) {
    console.error('useChat - Possible Issue: Contains the string "undefined", which is not valid in JSON.');
  } else if (jsonString.includes('{') && !jsonString.includes('}')) {
    console.error('useChat - Possible Issue: Opening curly brace found without a matching closing brace.');
  } else if (jsonString.includes('[') && !jsonString.includes(']')) {
    console.error('useChat - Possible Issue: Opening square bracket found without a matching closing bracket.');
  } else {
    console.error('useChat - Possible Issue: Unknown JSON formatting issue.');
  }

  console.error('useChat - Suggested Fix: Verify if all JSON strings are correctly formatted with matching braces, quotes, and commas.');
}
