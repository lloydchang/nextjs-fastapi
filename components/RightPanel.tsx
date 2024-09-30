// components/RightPanel.tsx

'use client'; // Mark as a client component

import React from 'react';
import styles from './RightPanel.module.css';

const RightPanel: React.FC = React.memo(() => {
  return (
    <div className={styles.rightPanel}>
      <h1>and SDGs</h1>
      <iframe
        src="https://lloydchang.github.io/open-sdg-open-sdg-site-starter-site/reporting-status/" 
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="SDG Reporting Status"
        loading="lazy" // Lazy load iframe for performance
      />
    </div>
  );
});

export default RightPanel;
