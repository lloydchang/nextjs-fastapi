// File: components/organisms/Tools.tsx

import React from 'react';
import styles from '../../styles/components/organisms/Tools.module.css';

const Tools: React.FC = () => {
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles['tools-container']}>
      <div className={styles['button-group']}>
        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://www.unsdglearn.org/learning/')}
        >
          Learn
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://unhabitat.org/topics/voluntary-local-reviews?order=field_year_of_publication_vlr&sort=desc#block-vlrworldmap')}
        >
          Local
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://open-sdg.org/community#cities-and-regions')}
        >
          City
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://unstats.un.org/sdgs/dataportal/countryprofiles')}
        >
          Country
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://hdr.undp.org/data-center/country-insights#/ranks')}
        >
          Rank
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://datatopics.worldbank.org/sdgatlas')}
        >
          Atlas
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://jointsdgfund.org/sdg-financing#PROFILES')}
        >
          Fund
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://mptf.undp.org/#impact-to-label')}
        >
          Hub
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://countrydata.iatistandard.org/')}
        >
          Aid
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://unstats.un.org/UNSDWebsite/undatacommons/search')}
        >
          Data
        </button>

        <button
          className={styles['right-edge-button']}
          onClick={() => openInNewTab('https://www.local2030.org/discover-tools')}
        >
          Tools
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
