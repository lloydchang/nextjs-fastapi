// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setError, setLoading } from 'store/talkSlice';
import { performSearchWithExponentialBackoff, sendFirstAvailableTranscript } from 'components/utils/searchUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState('');
  const initialRender = useRef(true);
  const hasSentMessage = useRef(new Set<string>());
  const lastDispatchedTalkId = useRef<string | null>(null);

  useEffect(() => {
    if (initialRender.current) {
      console.log('TalkPanel - Initial mount detected, performing search:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    }
  }, []);

  const performSearch = async (query: string) => {
    dispatch(setError(null));
    dispatch(setLoading(true));

    const searchResults = await performSearchWithExponentialBackoff(query);

    if (searchResults) {
      dispatch(setTalks(searchResults));
      await sendFirstAvailableTranscript(dispatch, query, searchResults, lastDispatchedTalkId, hasSentMessage);
    } else {
      dispatch(setError('Failed to fetch talks.'));
    }

    dispatch(setLoading(false));
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
    <div className={styles.TalkPanel}>
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          {loading && <LoadingSpinner />}
        </div>
        <button
          onClick={() => performSearch(searchQuery)}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          Search
        </button>
        {selectedTalk && (
          <button onClick={openTranscriptInNewTab} className={`${styles.button} ${styles.tedButton}`}>
            Transcript
          </button>
        )}
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      <div className={styles.scrollableContainer}>
        {talks.length > 0 && (
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <TalkItem key={index} talk={talk} selected={selectedTalk?.title === talk.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
