// components/molecules/ResultsList.tsx

'use client';

import React from 'react';

type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

interface ResultsListProps {
  talks: Talk[];
  onSelect: (talk: Talk) => void;
}

// Displays a list of talks
const ResultsList: React.FC<ResultsListProps> = ({ talks, onSelect }) => {
  return (
    <div>
      {talks.length > 0 ? (
        <ul>
          {talks.map((talk, index) => (
            <li key={index} onClick={() => onSelect(talk)}>
              <h3>{talk.title}</h3>
              <p>{talk.sdg_tags.join(', ')}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No talks found.</p>
      )}
    </div>
  );
};

export default React.memo(ResultsList);
