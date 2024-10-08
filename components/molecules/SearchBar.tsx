// components/molecules/SearchBar.tsx

'use client';

import React, { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState<string>("");

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Call onSearch with the current query, regardless of loading state
      onSearch(query);
    }
  }, [query, onSearch]);

  const handleClick = () => {
    // Call onSearch with the current query, even if loading is true
    onSearch(query);
  };

  return (
    <div>
      <input
        type="text"
        placeholder=""
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
      />
      <button onClick={handleClick} disabled={loading && query.trim() === ""}>
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
};

export default React.memo(SearchBar);
