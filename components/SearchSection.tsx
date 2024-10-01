// components/SearchSection.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';

type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

interface SearchSectionProps {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => Promise<void>;
  loading: boolean;
  selectedTalk: Talk | null;
  setSelectedTalk: React.Dispatch<React.SetStateAction<Talk | null>>;
  talks: Talk[];
}

const SearchSection: React.FC<SearchSectionProps> = ({
  query,
  setQuery,
  handleSearch,
  loading,
  selectedTalk,
  setSelectedTalk,
  talks,
}) => {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
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
          <button
            onClick={() => window.open(selectedTalk.url, '_blank')}
            className={`${styles.button} ${styles.tedButton}`}
          >
            Play in New Tab
          </button>
        )}
        {loading && (
          <div className={styles.loadingSpinner}>
            <Image src={SDGWheel} alt="Loading..." width={24} height={24} />
          </div>
        )}
      </div>

      {/* Search Results Section */}
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
    </div>
  );
};

export default SearchSection;
