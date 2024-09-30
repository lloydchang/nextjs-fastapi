// components/RightPanel.tsx

import React from 'react';
import styles from './RightPanel.module.css';
import dynamic from 'next/dynamic';

// If RightPanel is considered heavy, it can be lazy loaded in the main app
// But since this is already being lazy loaded in the main app, optimize here

const RightPanel: React.FC = () => {
  return (
    <div className={styles.rightPanel}>
      <h1>and SDGs</h1>
      <iframe
        src="https://lloydchang.github.io/open-sdg-open-sdg-site-starter-site/reporting-status/" 
        width="100%"
        height="100%"
        className={styles.iframe}
        title="SDG Reporting Status"
        loading="lazy" // Lazy load the iframe
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(RightPanel);
