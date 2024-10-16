// File: components/organisms/Tools.tsx

import React, { useState, useRef, useEffect } from 'react'; // Updated to include useState, useRef, useEffect
import styles from 'styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  // State and refs for dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragItem = useRef<HTMLDivElement | null>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  // Open links in new tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragItem.current = e.currentTarget as HTMLDivElement;
    dragStartPosition.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  // Mouse move event to handle the drag movement
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPosition.current.x,
        y: e.clientY - dragStartPosition.current.y,
      });
    }
  };

  // Mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // useEffect to add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className={styles['tools-container']}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }} // Positioning applied via inline styles
      onMouseDown={handleMouseDown} // Attaching mouse down event to initiate drag
    >
      <div className={styles['button-group']}>
        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://www.un.org/sustainabledevelopment/takeaction/')
          }
        >
          Lazy
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab(
              'https://www.un.org/sustainabledevelopment/the-lazy-persons-guide-to-saving-water/'
            )
          }
        >
          Water
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab(
              'https://www.un.org/sustainabledevelopment/climate-action-superheroes/'
            )
          }
        >
          Heroes
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://www.un.org/en/actnow')
          }
        >
          Act
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab(
              'https://drive.google.com/file/d/1iMdE6DLLuCqwq3K9U-DaTUWB6KyMa8QG/view'
            )
          }
        >
          Daily
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://actnow.aworld.org/')
          }
        >
          App
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://go-goals.org/')
          }
        >
          Game
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://www.unsdglearn.org/learning/')}
        >
          Learn
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://sdgs.un.org/topics/voluntary-local-reviews')
          }
        >
          Voluntary
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab(
              'https://unhabitat.org/topics/voluntary-local-reviews?order=field_year_of_publication_vlr&sort=desc#block-vlrworldmap'
            )
          }
        >
          Local
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://www.local2030.org/vlrs')
          }
        >
          Review
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://www.iges.or.jp/en/projects/vlr')
          }
        >
          Lab
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://open-sdg.org/community#cities-and-regions')
          }
        >
          City
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://unstats.un.org/sdgs/dataportal/countryprofiles')
          }
        >
          Country
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://sdgs.un.org/gsdr')
          }
        >
          Global
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://sdgs.un.org/goals')
          }
        >
          Annual
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://hdr.undp.org/data-center/country-insights#/ranks')
          }
        >
          Rank
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://datatopics.worldbank.org/sdgatlas')
          }
        >
          Atlas
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://globalaffairs.ucdavis.edu/sdgs-grants')
          }
        >
          Grant
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://jointsdgfund.org/sdg-financing#PROFILES')
          }
        >
          Fund
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://mptf.undp.org/#impact-to-label')
          }
        >
          Hub
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://countrydata.iatistandard.org/')
          }
        >
          Aid
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://unstats.un.org/UNSDWebsite/undatacommons/search')
          }
        >
          Data
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://ai4good.org/what-we-do/sdg-data-catalog/')
          }
        >
          Catalog
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab('https://www.local2030.org/discover-tools')
          }
        >
          Tool
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() =>
            openInNewTab(
              'https://news.google.com/topics/CAAqJAgKIh5DQkFTRUFvS0wyMHZNSEk0YTI1c1poSUNaVzRvQUFQAQ'
            )
          }
        >
          News
        </button>
      </div>
    </div>
  );
};

export default Tools;
