// components/RightPanel.tsx

'use client'; // Mark as a client component

import React from 'react';
import styles from './RightPanel.module.css';
import dynamic from 'next/dynamic';

// Lazy load components if necessary
// const AnotherHeavyComponent = dynamic(() => import('./AnotherHeavyComponent'), {
//   loading: () => <p>Loading...</p>,
//   ssr: false,
// });

const RightPanel: React.FC = () => {
  return (
    <div className={styles.rightPanel}>
      <h1 className={styles.header}>and SDGs</h1>
      <iframe
        src="https://lloydchang.github.io/open-sdg-open-sdg-site-starter-site/reporting-status/" 
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="SDG Reporting Status"
        loading="lazy"
      />
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(RightPanel);
