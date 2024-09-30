// components/FetchIframeContent.tsx

import React, { useEffect, useState } from 'react';
import styles from '../styles/FetchIframeContent.module.css';

const FetchIframeContent: React.FC = () => {
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      {loading ? (
        <p className={styles.loading}>Loading links...</p>
      ) : (
        <ul className={styles.linksList}>
          {links.map((link, index) => (
            <li key={index} className={styles.linkItem}>
              <a href={link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {link}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default React.memo(FetchIframeContent);
