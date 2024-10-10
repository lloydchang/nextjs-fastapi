// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import SDGWheel from 'public/images/SDGWheel.png';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import axios from 'axios';
import fetch from 'node-fetch'; // Import node-fetch
import cheerio from 'cheerio'; // Import cheerio for server-side HTML parsing
import { RootState } from 'store/store';
import { setTalks, setSelectedTalk, setError, setLoading } from 'store/talkSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'components/state/types';

const sdgTitleMap: Record<string, string> = {
  sdg1: 'SDG 1: No Poverty',
  sdg2: 'SDG 2: Zero Hunger',
  sdg3: 'SDG 3: Good Health and Well-Being',
  sdg4: 'SDG 4: Quality Education',
  sdg5: 'SDG 5: Gender Equality',
  sdg6: 'SDG 6: Clean Water and Sanitation',
  sdg7: 'SDG 7: Affordable and Clean Energy',
  sdg8: 'SDG 8: Decent Work and Economic Growth',
  sdg9: 'SDG 9: Industry, Innovation, and Infrastructure',
  sdg10: 'SDG 10: Reduced Inequalities',
  sdg11: 'SDG 11: Sustainable Cities and Communities',
  sdg12: 'SDG 12: Responsible Consumption and Production',
  sdg13: 'SDG 13: Climate Action',
  sdg14: 'SDG 14: Life Below Water',
  sdg15: 'SDG 15: Life on Land',
  sdg16: 'SDG 16: Peace, Justice, and Strong Institutions',
  sdg17: 'SDG 17: Partnerships for the Goals',
};

const determineInitialKeyword = () => {
  const keywords = [
    'poverty', 'hunger', 'health', 'education', 'gender',
    'water', 'energy', 'work', 'industry', 'inequality',
    'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'
  ];
  const randomIndex = Math.floor(Math.random() * keywords.length);
  return keywords[randomIndex];
};

// Fisher-Yates shuffle to randomize an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Function to scrape the transcript from TED Talk URL using cheerio
const scrapeTranscript = async (transcriptUrl: string): Promise<string> => {
  try {
    // Use node-fetch to get the HTML of the transcript page
    const response = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const html = await response.text();

    // Load HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Select transcript paragraphs using class name
    const paragraphs = $('.talk-transcript__para__text');
    let transcript = '';

    paragraphs.each((index, element) => {
      transcript += $(element).text() + ' ';
    });

    return transcript.trim();
  } catch (error) {
    console.error(`Error scraping transcript: ${error}`);
    return 'Failed to retrieve transcript.';
  }
};

const TalkPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());

  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      performSearch(searchQuery);
      initialRender.current = false;
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      // Map the results into Talk objects
      let data: Talk[] = response.data.results.map((result: any) => ({
        title: result.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.slug}`,
        sdg_tags: result.sdg_tags || [],
      }));

      // Randomize the sequence of the results
      data = shuffleArray(data);

      dispatch(setTalks(data));
      dispatch(setSelectedTalk(data[0] || null));

      // Send the scraped transcript of the first talk
      if (data.length > 0) {
        const firstTalk = data[0];
        const transcriptUrl = `${firstTalk.url}/transcript?subtitle=en`;

        const sdgTag = firstTalk.sdg_tags.length > 0 ? sdgTitleMap[firstTalk.sdg_tags[0]] : 'No SDG Tag';
        const transcript = await scrapeTranscript(transcriptUrl);

        // Send the scraped transcript to the chat
        dispatch(sendMessage(`${firstTalk.title}\n\n${sdgTag}\n\n\n${transcript}`));
      }
    } catch (error) {
      dispatch(setError("Failed to fetch talks."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
    }
  };

  return (
    <div className={`${styles.TalkPanel}`}>
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search talks…"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          {/* Reserve space for the spinner using visibility instead of conditional rendering */}
          <div className={styles.loadingSpinnerContainer} style={{ visibility: loading ? 'visible' : 'hidden' }}>
            <Image src={SDGWheel} alt="Loading" width={24} height={24} className={styles.loadingSpinner} />
          </div>
        </div>
        <button onClick={() => performSearch(searchQuery)} className={`${styles.button} ${styles.searchButton}`} disabled={loading}>
          Search
        </button>
        {selectedTalk && (
          <button onClick={openTranscriptInNewTab} className={`${styles.button} ${styles.tedButton}`}>
            Transcript
          </button>
        )}
      </div>

      {error && <div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div>}

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`} width="100%" height="400px" allow="autoplay; fullscreen; encrypted-media" />
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
                  dispatch(setSelectedTalk(talk));
                }}>
                <h3>
                  <a href="#" className={styles.resultLink}>{talk.title}</a>
                  <p className={styles.sdgTags}>{talk.sdg_tags.map(tag => sdgTitleMap[tag]).join(', ')}</p>
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
