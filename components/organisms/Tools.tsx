// File: components/organisms/Tools.tsx

import React from 'react';
import '../../styles/components/organisms/Tools.css';

interface ToolsProps {
  messages: string[];
}

const Tools: React.FC<ToolsProps> = () => {
  // Function to handle opening a new tab for a given URL
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tools-container">
      {/* Localizing Button */}
      <button
        className="right-edge-button"
        onClick={() => openInNewTab('https://www.local2030.org/discover-tools')}
      >
        Localizing
      </button>

      {/* Learning Button */}
      <button
        className="right-edge-button"
        onClick={() => openInNewTab('https://www.unsdglearn.org/learning/')}
      >
        Learning
      </button>

      {/* Financing Button */}
      <button
        className="right-edge-button"
        onClick={() => openInNewTab('https://jointsdgfund.org/sdg-financing')}
      >
        Financing
      </button>

      {/* News Button */}
      <button
        className="right-edge-button"
        onClick={() =>
          openInNewTab(
            'https://news.google.com/topics/CAAqJAgKIh5DQkFTRUFvS0wyMHZNSEk0YTI1c1poSUNaVzRvQUFQAQ'
          )
        }
      >
        News
      </button>
    </div>
  );
};

export default Tools;
