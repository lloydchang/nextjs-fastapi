// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import { useChatContext } from '../context/ChatContext';
import DebugPanel from './DebugPanel'; // Import DebugPanel
import axios from 'axios'; // Import axios

// TypeScript Types
type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

// List of SDG keywords
const sdgKeywords = [
  'poverty', 'hunger', 'health', 'education', 'gender',
  'water', 'energy', 'work', 'industry', 'inequality',
  'city', 'consumption', 'climate', 'ocean', 'land',
  'peace', 'partnership'
];

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const { sendActionToChatbot } = useChatContext();

  // Track whether the initial keyword has been set
  const initialKeyword = useRef<string>(""); // No initial value
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [transcriptSaved, setTranscriptSaved] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]); // State to hold logs for DebugPanel
  const [errorDetails, setErrorDetails] = useState<string>(''); // State for error details
  const [transcriptStatus, setTranscriptStatus] = useState<string>(''); // Track transcript scraping status
  const [transcript, setTranscript] = useState<string>(''); // Store retrieved transcript

  // Helper function to add logs
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Update logs state
  };

  // Function to determine the initial keyword based on randomization
  const determineInitialKeyword = () => {
    const randomIndex = Math.floor(Math.random() * sdgKeywords.length);
    return sdgKeywords[randomIndex];
  };

  // Function to scrape the transcript using axios
  const scrapeTranscript = async (url: string) => {
    addLog('Starting to scrape transcript...');
    const transcriptUrl = `http://localhost:8000/api/py/scrape-transcript/`; // Adjust if needed
    try {
      const response = await axios.post(transcriptUrl, { url }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      addLog(`Scraping initiated: ${response.data.message}`);
      setTranscriptStatus(response.data.message);
    } catch (err) {
      addLog("Error initiating transcript scraping.");
      if (axios.isAxiosError(err)) {
        addLog(`Axios error: ${err.message}`);
        if (err.response) {
          addLog(`Error Response Status: ${err.response.status}`);
          addLog(`Error Response Data: ${JSON.stringify(err.response.data)}`);
        }
      } else {
        addLog(`Unexpected error: ${err}`);
      }
      setError("Failed to initiate transcript scraping.");
      setErrorDetails(err.message);
    }
  };

  // Function to retrieve the transcript
  const retrieveTranscript = async (url: string) => {
    addLog('Attempting to retrieve transcript...');
    const getTranscriptUrl = `http://localhost:8000/api/py/get-transcript/?url=${encodeURIComponent(url)}`;
    try {
      const response = await axios.get(getTranscriptUrl);
      if (response.data.status === "completed") {
        setTranscript(response.data.transcript);
        addLog("Transcript retrieved successfully.");
        setTranscriptStatus("completed");
      } else if (response.data.status === "error") {
        setTranscriptStatus("error");
        setError("Failed to retrieve transcript.");
        setErrorDetails(response.data.message);
        addLog(`Transcript retrieval error: ${response.data.message}`);
      } else {
        setTranscriptStatus("not found");
        addLog("Transcript not found yet.");
      }
    } catch (err) {
      addLog("Error retrieving transcript.");
      if (axios.isAxiosError(err)) {
        addLog(`Axios error: ${err.message}`);
        if (err.response) {
          addLog(`Error Response Status: ${err.response.status}`);
          addLog(`Error Response Data: ${JSON.stringify(err.response.data)}`);
        }
      } else {
        addLog(`Unexpected error: ${err}`);
      }
      setError("Failed to retrieve transcript.");
      setErrorDetails(err.message);
    }
  };

  // Function to send the transcript to the chatbot
  const sendTranscriptToChatbot = async (transcriptText: string) => {
    addLog('Sending transcript to chatbot...');
    if (selectedTalk) {
      const formattedMessage = `🎙️ Transcript of "${selectedTalk.title}": ${transcriptText}`;
      addLog('Sending Message to Chatbot: ' + formattedMessage);
      try {
        await sendActionToChatbot(formattedMessage);
        addLog('Message Sent Successfully');
        setTranscriptSaved(true);
      } catch (err) {
        addLog("Failed to send message to chatbot.");
        setError("Failed to send the transcript to the chatbot.");
        setErrorDetails(err.message); // Set error details
      }
    } else {
      addLog("No selected talk available to send.");
    }
  };

  // Define the function to handle transcript scraping and sending
  const handleTranscript = useCallback(async () => {
    if (selectedTalk) {
      try {
        // Initiate scraping
        await scrapeTranscript(selectedTalk.url);
        
        // Polling to check when transcript is available
        const pollInterval = 5000; // 5 seconds
        const maxAttempts = 12; // Poll for 1 minute
        let attempts = 0;

        const pollTranscript = setInterval(async () => {
          attempts += 1;
          addLog(`Polling attempt ${attempts} for transcript...`);
          await retrieveTranscript(selectedTalk.url);
          
          if (transcriptStatus === "completed" || attempts >= maxAttempts) {
            clearInterval(pollTranscript);
            if (transcriptStatus === "completed") {
              await sendTranscriptToChatbot(transcript);
            } else {
              addLog("Transcript scraping timed out.");
            }
          }
        }, pollInterval);
      } catch (err) {
        addLog("Error in handling transcript process.");
      }
    }
  }, [selectedTalk, transcript, transcriptStatus]);

  // Define the search function with result randomization
  const handleSearch = useCallback(async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSelectedTalk(null);
    setTranscriptSaved(false); // Reset save state on new search
    setErrorDetails(''); // Reset error details on new search
    setTranscript('');
    setTranscriptStatus('');

    addLog('Initiating Search...');
    try {
      const response = await axios.get(`http://localhost:8000/api/py/search?query=${encodeURIComponent(query)}`);
      if (response.status !== 200) {
        addLog(`Search failed. Status: ${response.status} - ${response.statusText}`);
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      let data: Talk[] = response.data;

      // Randomize the order of the results
      data = data.sort(() => Math.random() - 0.5);

      setTalks(data);
      addLog('Search results retrieved: ' + data.length + ' talks found.');

      if (data.length > 0) {
        setSelectedTalk(data[0]);
        addLog('Selected Talk: ' + data[0].title);
      }
    } catch (err) {
      addLog("Failed to fetch search results.");
      setError("Failed to fetch search results. Please check if the backend server is running.");
      setErrorDetails(err.message); // Set error details
    } finally {
      setLoading(false);
    }
  }, [query, setTalks]);

  // Set the initial keyword when the component mounts
  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      setSearchInitiated(true);
      addLog(`Initial keyword set: ${initialKeyword.current}`);
    }
  }, []);

  // Run the search after setting the query
  useEffect(() => {
    if (searchInitiated) {
      handleSearch();
    }
  }, [searchInitiated, handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const generateEmbedUrl = useCallback((url: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : url;
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
      addLog(`Opened transcript in a new tab: ${transcriptUrl}`);
    }
  };

  return (
    <div className={styles.middlePanel}>
      {/* Search Section */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        {selectedTalk && (
          <>
            <button
              onClick={handleTranscript} // Call handleTranscript to separate logic
              className={`${styles.button} ${styles.chatButton}`}
            >
              Chat
            </button>
            <button
              onClick={openTranscriptInNewTab} // Open transcript URL in a new tab
              className={`${styles.button} ${styles.tedButton}`}
            >
              View Transcript
            </button>
            <button
              onClick={() => window.open(selectedTalk.url, '_blank')}
              className={`${styles.button} ${styles.tedButton}`}
            >
              Play in New Tab
            </button>
          </>
        )}
        {loading && (
          <div className={styles.loadingSpinnerContainer}>
            <Image
              src={SDGWheel}
              alt="Loading..."
              width={24}
              height={24}
              className={styles.loadingSpinner} // Add class to Image for rotation
            />
          </div>
        )}
      </div>

      {/* Now Playing Section */}
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={generateEmbedUrl(selectedTalk.url)}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
          />
          {transcriptSaved && <p className={styles.successMessage}>Transcript sent successfully!</p>}
          {transcript && <p className={styles.transcriptText}>{transcript}</p>}
        </div>
      )}

      {/* Search Results Section */}
      {searchInitiated && (
        <div className={styles.resultsContainer}>
          {talks.map((talk, index) => (
            <div key={index} className={styles.resultItem}>
              <h3>
                <a
                  href="#"
                  className={styles.resultLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTalk(talk);
                    setTranscript(''); // Reset transcript when selecting a new talk
                    setTranscriptStatus('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {talk.title}
                </a>
                <p className={styles.sdgTags}>
                  {talk.sdg_tags.length > 0 ? talk.sdg_tags.join(', ') : ''}
                </p>
              </h3>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
      
      {/* Render Debug Panel */}
      <DebugPanel logs={logs} curlCommand="Example CURL Command" errorDetails={errorDetails} />
    </div>
  );
};

export default React.memo(MiddlePanel);
