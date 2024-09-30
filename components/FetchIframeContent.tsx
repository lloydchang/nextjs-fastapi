// components/FetchIframeContent.tsx

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './FetchIframeContent.module.css';

// Lazy load the iframe component
const DynamicIframe = dynamic(() => import('./DynamicIframe'), {
  loading: () => <p>Loading iframe...</p>,
  ssr: false,
});

const FetchIframeContent: React.FC = () => {
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
            <li key={index}>
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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(FetchIframeContent);
