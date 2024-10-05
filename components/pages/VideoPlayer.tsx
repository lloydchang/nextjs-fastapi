// components/pages/VideoPlayer.tsx

'use client';

import React from 'react';

interface VideoPlayerProps {
  url: string | null;
}

// Component to display video based on the provided URL
const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  if (!url) return null;

  const generateEmbedUrl = (videoUrl: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = videoUrl.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : videoUrl;
  };

  return (
    <div>
      <iframe
        src={generateEmbedUrl(url)}
        width="100%"
        height="400px"
        allow="autoplay; fullscreen; encrypted-media"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default React.memo(VideoPlayer);
