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

        {/* Local Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://unhabitat.org/topics/voluntary-local-reviews?order=field_year_of_publication_vlr&sort=desc#block-vlrworldmap')}
        >
          Local
        </button>

        {/* City Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://open-sdg.org/community#cities-and-regions')}
        >
          City
        </button>

        {/* Country Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://unstats.un.org/sdgs/dataportal/countryprofiles')}
        >
          Country
        </button>

        {/* Fund Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://jointsdgfund.org/sdg-financing#PROFILES')}
        >
          Fund
        </button>

        {/* Hub Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://mptf.undp.org/#impact-to-label')}
        >
          Hub
        </button>

        {/* Data Button */}
        <button
          className="right-edge-button"
          onClick={() => openInNewTab('https://unstats.un.org/UNSDWebsite/undatacommons/search')}
        >
          Data
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
