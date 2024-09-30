// components/FetchIframeContent.tsx

import React, { useEffect, useState } from 'react';
import styles from './FetchIframeContent.module.css';

const FetchIframeContent: React.FC = React.memo(() => {
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/api/fetchIframeContent'); // Use your API route
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setLinks(data.links || []);
        }
      } catch (err) {
        setError('Failed to fetch links.');
      }
    };

    fetchLinks();
  }, []);

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
        <p className={styles.loading}>Loading links...</p>
      )}
    </div>
  );
});

export default FetchIframeContent;
