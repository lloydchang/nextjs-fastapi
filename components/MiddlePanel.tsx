// src/components/MiddlePanel.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png'; // Import SDG Wheel for search loading indicator
import styles from './MiddlePanel.module.css'; // Import the CSS module

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const initialKeyword = useRef<string>("TED AI"); // Fixed initial keyword

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Search loading state
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<any>(null);

  useEffect(() => {
    handleSearch(); // Trigger search on initial render
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSearch = async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSearchInitiated(true);
    setSelectedTalk(null);

    try {
      let url = `http://127.0.0.1:8000/api/py/search?query=${query}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setTalks(data);
        if (data.length > 0) {
          setSelectedTalk(data[0]); // Automatically set the first talk as "Now Playing"
        }
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      setError("Failed to fetch search results. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedUrl = (url: string) => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    if (match) {
      return `https://embed.ted.com/talks/${match[1]}`;
    }
    return url;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.middlePanel}>
      {/* Search Input, Button, and Loading Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0px' }}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress} // Add key press event listener
          style={{ padding: '0px', width: '200px', fontSize: '14px', color: '#000', backgroundColor: '#fff' }}
        />
        <button 
          onClick={handleSearch} 
          style={{ padding: '6px 12px', marginLeft: '10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff' }}
        >
          Search
        </button>
        {/* Moved "Play in New Tab" button to top beside Search button */}
        {selectedTalk && (
          <button
            onClick={() => window.open(selectedTalk.url, '_blank')}
            className={styles.tedButton} // Applied TED button styles
          >
            Play in New Tab
          </button>
        )}
        {/* Search loading spinner */}
        {loading && (
          <div style={{ marginLeft: '10px' }}>
            <Image
              src={SDGWheel}
              alt="Loading..."
              width={24}
              height={24}
              style={{ animation: 'spin 2s linear infinite' }}
            />
          </div>
        )}
      </div>

      {/* Now Playing Section */}
      {selectedTalk && (
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <iframe
            src={generateEmbedUrl(selectedTalk.url)}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* Conditionally Render Search Results Section */}
      {searchInitiated && (
        <div style={{ marginTop: '0px' }}>
          {talks.length > 0 ? (
            talks.map((talk, index) => (
              <div key={index} style={{ padding: '0px', borderBottom: '1px solid #ddd', fontSize: '10px' }}>
                <h3>
                  <a 
                    href="#" // Prevent default navigation
                    rel="noopener noreferrer" 
                    style={{ fontSize: '14px', color: '#EB0028', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTalk(talk);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {talk.title}
                  </a>
                </h3>
              </div>
            ))
          ) : (
            <p></p>
          )}
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: '0px' }}>{error}</p>}
    </div>
  );
};

export default MiddlePanel;
