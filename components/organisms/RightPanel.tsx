// File: app/components/organisms/RightPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../state/context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../../public/images/SDGWheel.png';
import styles from '../../styles/components/organisms/RightPanel.module.css';
import { useChatContext } from '../state/context/ChatContext';
import axios from 'axios';

// TypeScript Types
type Talk = {
  title: string;  // Use 'title' instead of 'presenter'
  url: string;
  sdg_tags: string[];
};

// SDG title mapping
const sdgTitleMap: Record<string, string> = {
  'sdg1': 'SDG 1: No Poverty',
  'sdg2': 'SDG 2: Zero Hunger',
  'sdg3': 'SDG 3: Good Health and Well-Being',
  'sdg4': 'SDG 4: Quality Education',
  'sdg5': 'SDG 5: Gender Equality',
  'sdg6': 'SDG 6: Clean Water and Sanitation',
  'sdg7': 'SDG 7: Affordable and Clean Energy',
  'sdg8': 'SDG 8: Decent Work and Economic Growth',
  'sdg9': 'SDG 9: Industry, Innovation, and Infrastructure',
  'sdg10': 'SDG 10: Reduced Inequalities',
  'sdg11': 'SDG 11: Sustainable Cities and Communities',
  'sdg12': 'SDG 12: Responsible Consumption and Production',
  'sdg13': 'SDG 13: Climate Action',
  'sdg14': 'SDG 14: Life Below Water',
  'sdg15': 'SDG 15: Life on Land',
  'sdg16': 'SDG 16: Peace, Justice, and Strong Institutions',
  'sdg17': 'SDG 17: Partnerships for the Goals'
};

// Updated initial keyword logic with randomization
const determineInitialKeyword = () => {
  const randomNumber = Math.floor(Math.random() * 18); // Generates a number between 0 and 17
  console.log(`[DEBUG] Generated random number: ${randomNumber}`);
  return randomNumber === 0 
    ? "TED AI" 
    : ['poverty', 'hunger', 'health', 'education', 'gender', 'water', 'energy', 'work', 'industry', 'inequality', 'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'][randomNumber - 1];
};

const RightPanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const { sendActionToChatbot } = useChatContext();
  const initialKeyword = useRef<string>(""); // No initial value
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  // Initial keyword setup and search
  useEffect(() => {
    console.log("[DEBUG] useEffect triggered for initial keyword setup.");
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword(); // Use the new randomization logic here
      console.log(`[DEBUG] Initial keyword set to: ${initialKeyword.current}`);
      setQuery(initialKeyword.current);
      performSearch(initialKeyword.current); // Trigger initial search
    }
  }, []);

  // Separate function for performing a search
  const performSearch = (searchQuery: string) => {
    console.log(`[DEBUG] Performing search with query: ${searchQuery}`);
    setLoading(true);
    setError(null);
    
    axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(searchQuery)}`)
      .then((searchResponse) => {
        console.log(`[DEBUG] Received response: `, searchResponse);
        if (searchResponse.status !== 200) {
          throw new Error(`Error: ${searchResponse.status} - ${searchResponse.statusText}`);
        }
  
        const responseData = searchResponse.data;
  
        if (responseData.results && Array.isArray(responseData.results)) {
          // Case 1: Successful Search with Results
          let data: Talk[] = responseData.results.map((result: any) => {
            // Create title from slug by replacing underscores with spaces
            const title = result.slug.replace(/_/g, ' ');
  
            const talk = {
              title: title,  // Use modified slug as title
              url: `https://www.ted.com/talks/${result.slug}`,
              sdg_tags: result.sdg_tags || [] // Ensure sdg_tags is an array even if not present
            };
  
            // Log the talk data for debugging
            console.log(`[DEBUG] Talk Data - Title: ${talk.title}, URL: ${talk.url}, SDG Tags: ${talk.sdg_tags}`);
  
            return talk;
          });
  
          console.log(`[DEBUG] Fetched talks data: `, data);
          data = data.sort(() => Math.random() - 0.5);
          setTalks(data);
  
          if (data.length > 0) {
            setSelectedTalk(data[0]);
            console.log(`[DEBUG] Selected talk: `, data[0]);
          } else {
            setSelectedTalk(null); // No talks found
            console.log("[DEBUG] No talks found for the query.");
          }
        } else if (responseData.detail && Array.isArray(responseData.detail)) {
          // Case 2: Error Response with Validation Error
          console.error(`[DEBUG] Validation error in search query: ${responseData.detail[0].msg}`);
          setError(`Search query error: ${responseData.detail[0].msg}`);
        } else if (responseData.message === "No results found.") {
          // Case 3: No Results Found
          console.log(`[DEBUG] No results found for query: ${searchQuery}`);
          setError("No results found.");
          setTalks([]);
          setSelectedTalk(null);
        } else {
          // Unexpected Response Format
          throw new Error("Unexpected response format received.");
        }
      })
      .catch((err) => {
        console.error(`[DEBUG] Error fetching talks: ${err}`);
        setError("Failed to fetch talks.");
      })
      .finally(() => {
        console.log("[DEBUG] Search process completed.");
        setLoading(false);
      });
  };  

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`[DEBUG] Input changed to: ${e.target.value}`);
    setQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log(`[DEBUG] Enter key pressed, triggering search for query: ${query}`);
      performSearch(query); // Trigger search on Enter key
    }
  }, [query]);

  const generateEmbedUrl = useCallback((url: string | undefined): string => {
    if (!url || typeof url !== "string") {
      console.warn(`[DEBUG] Invalid URL provided: ${url}`);
      return url ?? "";
    }

    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    const embedUrl = match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : url;
    console.log(`[DEBUG] Generated embed URL: ${embedUrl}`);
    return embedUrl;
  }, []);

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      console.log(`[DEBUG] Opening transcript in new tab: ${transcriptUrl}`);
      window.open(transcriptUrl, '_blank');
    } else {
      console.warn("[DEBUG] No talk selected for transcript.");
    }
  };

  return (
    <div className={styles.rightPanel}>
      <div className={styles.searchContainer}>
        <div className={styles.searchRowContainer}>
          <input
            type="text"
            placeholder="Enter a keyword"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          <button
            onClick={() => performSearch(query)}
            className={`${styles.button} ${styles.searchButton}`}
            disabled={loading}
          >
            {"Search"}
          </button>
          {selectedTalk && (
            <>
              <button
                onClick={openTranscriptInNewTab}
                className={`${styles.button} ${styles.tedButton}`}
              >
                Transcript
              </button>
            </>
          )}
        </div>
        {loading && (
          <div className={styles.loadingSpinnerContainer}>
            <Image
              src={SDGWheel}
              alt="Loading..."
              width={24}
              height={24}
              className={styles.loadingSpinner}
            />
          </div>
        )}
      </div>

      <div className={styles.errorContainer}>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={generateEmbedUrl(selectedTalk.url)}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
          />
        </div>
      )}

      {talks.length > 0 && (
        <div className={styles.scrollableContainer}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => {
                  console.log(`[DEBUG] Selected talk: ${talk.title}`);
                  setSelectedTalk(talk);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <h3>
                  <a href="#" className={styles.resultLink}>
                    {talk.title} {/* Use 'title' here */}
                  </a>
                  <p className={styles.sdgTags}>
                    {talk.sdg_tags && talk.sdg_tags.length > 0 ? talk.sdg_tags.map(tag => sdgTitleMap[tag]).join(', ') : ''}
                  </p>
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RightPanel);
