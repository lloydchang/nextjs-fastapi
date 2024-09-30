// components/FetchIframeContent.tsx

import React, { useEffect, useState } from 'react';

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
    <div>
      {error && <p>Error: {error}</p>}
      {links.length > 0 ? (
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading links...</p>
      )}
    </div>
  );
};

export default FetchIframeContent;
