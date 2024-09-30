// components/FetchIframeContent.tsx

import React, { useEffect, useState, useCallback } from 'react';
import styles from './FetchIframeContent.module.css';

const FetchIframeContent: React.FC = () => {
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/fetchIframeContent'); // Use your API route
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Failed to fetch links:', err);
      setError('Failed to fetch links.');
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>Error: {error}</p>}
      {links.length > 0 ? (
        <ul className={styles.linkList}>
          {links.map((link, index) => (
            <li key={index} className={styles.linkItem}>
              <a href={link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {link}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className={styles.loading}>Loading links...</p>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(FetchIframeContent);
