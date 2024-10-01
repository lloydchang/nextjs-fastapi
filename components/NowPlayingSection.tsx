// components/NowPlayingSection.tsx

'use client';

import React from 'react';
import styles from '../styles/MiddlePanel.module.css';

interface NowPlayingSectionProps {
  selectedTalk: { url: string } | null;
  generateEmbedUrl: (url: string) => string;
}

const NowPlayingSection: React.FC<NowPlayingSectionProps> = ({
  selectedTalk,
  generateEmbedUrl,
}) => {
  return (
    <>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={generateEmbedUrl(selectedTalk.url)}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
          />
        </div>
      )}
    </>
  );
};

export default NowPlayingSection;
