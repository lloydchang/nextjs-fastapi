// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
import { localStorageUtil } from 'components/utils/localStorage';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner'; // Your existing loading spinner
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';

// Helper function to capitalize only the first word (sentence case)
function toSentenceCase(text: string): string {
  const lowerText = text.toLowerCase();
  return lowerText.charAt(0).toUpperCase() + lowerText.slice(1);
}

// Helper function to remove diacritics (accents) from a string
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Helper function to remove the presenter's name from the title (ignoring accents)
function removePresenterFromTitle(presenter: string, title: string): string {
  const normalizedPresenter = removeDiacritics(presenter);
  const normalizedTitle = removeDiacritics(title);

  const regex = new RegExp(`\\b${normalizedPresenter}\\b`, 'gi');
  const cleanedTitle = normalizedTitle.replace(regex, '').trim();
  return cleanedTitle.replace(/\s+/g, ' '); // Ensure single spaces between words
}

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isStrictModeMount = useRef(true);
  const mountCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const isSearchInProgress = useRef(false);
  const sentMessagesRef = useRef<Set<string>>(new Set());

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  useEffect(() => {
    mountCounter.current += 1;

    if (mountCounter.current === 1) {
      isStrictModeMount.current = true;
    } else {
      isStrictModeMount.current = false;
      performSearch(searchQuery);
    }

    return () => {
      if (!isStrictModeMount.current) {
        abortControllerRef.current?.abort();
      }
      debouncedPerformSearch.cancel();
    };
  }, []);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    if (isSearchInProgress.current || trimmedQuery === lastQueryRef.current) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;
    dispatch(setLoading(true));
    dispatch(setApiError(null));

    try {
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.status !== 200) throw new Error(response.statusText);

      const data: Talk[] = response.data.results.map((result: any) => {
        // Process results...
      });

      handleSearchResults(data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('[performSearch] Error fetching talks:', error);
        dispatch(setApiError('Error fetching talks.'));
      }
    } finally {
      console.debug('[performSearch] Setting loading to false.');
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const handleSearchResults = (data: Talk[]) => {
    const uniqueTalks = shuffleArray(data).filter(
      (talk) => !talks.some((existing) => existing.url === talk.url)
    );
    dispatch(setTalks(uniqueTalks));

    if (uniqueTalks.length > 0) {
      const firstTalk = uniqueTalks[0];
      dispatch(setSelectedTalk(firstTalk));
      sendTranscriptAsMessage(firstTalk);
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
  };

  const sendTranscriptAsMessage = async (talk: Talk) => {
    if (sentMessagesRef.current.has(talk.title)) {
      return;
    }

    sentMessagesRef.current.add(talk.title);

    const messageParts = [
      `Presenter: ${talk.presenterDisplayName}`,
      `Talk: ${talk.title}`,
      `URL: ${talk.url}`,
      `SDG Tags: ${talk.sdg_tags.join(', ')}`,
      `Transcript: ${talk.transcript}`,
    ];

    for (const part of messageParts) {
      dispatch(sendMessage({ text: part, hidden: false }));
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  const shuffleTalks = () => {
    dispatch(setTalks(shuffleArray(talks)));
  };

  return (
    <div className={styles.TalkPanel}>
      {loading && <LoadingSpinner />} {/* Ensure this is the SDG wheel component */}

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={selectedTalk.title}
            onError={() => console.error('Failed to load iframe')}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
            className={styles.searchInput}
            placeholder="Search for talks..."
          />
          {loading && <LoadingSpinner />} {/* Confirm that both loading indicators are displayed */}
        </div>
        <button
          onClick={() => performSearch(searchQuery)}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          Search
        </button>
        <button onClick={shuffleTalks} className={`${styles.button} ${styles.shuffleButton}`}>
          Shuffle
        </button>
        {selectedTalk && (
          <button
            onClick={openTranscriptInNewTab}
            className={`${styles.button} ${styles.tedButton}`}
          >
            Transcript
          </button>
        )}
      </div>

      {error && <div className={styles.errorContainer}>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem key={`${talk.url}-${index}`} talk={talk} selected={selectedTalk?.title === talk.title} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
