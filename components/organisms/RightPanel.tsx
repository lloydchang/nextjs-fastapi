// components/organisms/RightPanel.tsx

'use client'; // Mark as a client component

import React from 'react';
import Image from 'next/image';
import SDGWheel from '../../public/images/SDGWheel.png';
import styles from '../../styles/components/organisms/RightPanel.module.css';

const RightPanel: React.FC = () => {
  return (
    <div className={styles.rightPanel}>
      <iframe
        src="https://lloydchang.github.io/open-sdg-open-sdg-site-starter-site/reporting-status/" 
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        loading="lazy"
        title="SDG Reporting Status"
      />
    </div>
  );
};

export default React.memo(RightPanel);
