// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { shuffleArray } from 'components/utils/talkPanelUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import { performSearch } from 'components/utils/apiUtils';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState('');
  const hasSearchedOnce = useRef(false);
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  const logState = (label: string) => {
    console.log(`[${label}] Redux State:`, { talks, selectedTalk, loading, error });
  };

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      console.log(`Debounced search initiated for query: ${query}`);
      dispatch(performSearch(query));
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    console.log('Component mounted.');

    if (!hasSearchedOnce.current) {
      console.log('Performing initial search...');
      debouncedPerformSearch(searchQuery);
      hasSearchedOnce.current = true;
    }

    return () => {
      console.log('Component unmounted. Cancelling debounced search...');
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery, debouncedPerformSearch]);

  const shuffleTalks = () => {
    console.log('Shuffling talks...');
    const shuffledTalks = shuffleArray(talks);
    console.log('Shuffled talks:', shuffledTalks);
    dispatch(setTalks(shuffledTalks));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.log(`Opening transcript for ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={`${selectedTalk.title} video`}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              console.log('Enter key pressed. Performing search...');
              debouncedPerformSearch(searchQuery);
            }
          }}
          className={styles.searchInput}
          placeholder="Search for talks..."
        />

        <div className={styles.buttonsContainer}>
          <button
            onClick={() => debouncedPerformSearch(searchQuery)}
            className={`${styles.button} ${styles.searchButton}`}
            disabled={loading}
          >
            Search
          </button>
          <button onClick={shuffleTalks} className={`${styles.button} ${styles.shuffleButton}`}>
            Shuffle Talks
          </button>
          {selectedTalk && (
            <button
              onClick={openTranscriptInNewTab}
              className={`${styles.button} ${styles.tedButton}`}
            >
              View Transcript
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {error && <div className={styles.errorContainer}>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem
            key={`${talk.url}-${index}`}
            talk={talk}
            selected={selectedTalk?.title === talk.title}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
