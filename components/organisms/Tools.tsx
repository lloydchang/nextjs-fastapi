// File: components/organisms/Tools.tsx

import React from 'react';
import '../../styles/components/organisms/Tools.css';

const Tools: React.FC = () => {
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tools-container">
      <div className="button-group">
        {/* Learn Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://www.unsdglearn.org/learning/')}
        >
          Learn
        </button>

        {/* Countries Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://unstats.un.org/sdgs/dataportal')}
        >
          Countries
        </button>

        {/* Cities Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://open-sdg.org/community')}
        >
          Cities
        </button>

        {/* Local Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://www.local2030.org/discover-tools')}
        >
          Local
        </button>

        {/* Fund Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://jointsdgfund.org/sdg-financing')}
        >
          Fund
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
    </div>
  );
};

export default Tools;
