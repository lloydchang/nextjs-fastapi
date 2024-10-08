// File: components/organisms/Tools.tsx

import React from 'react';
import '../../styles/components/organisms/Tools.css';

const Tools: React.FC = () => {  // Removed the `messages` prop from the component
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

      {/* Reporting Button */}
      <button
        className="right-edge-button"
        onClick={() => openInNewTab('https://open-sdg.org/community')}
      >
        Reporting
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
