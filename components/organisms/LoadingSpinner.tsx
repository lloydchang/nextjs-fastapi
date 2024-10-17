// File: components/organisms/LoadingSpinner.tsx

import React from 'react';
import Image from 'next/image';
import SDGWheel from 'public/images/SDGWheel.png';
import styles from 'styles/components/organisms/LoadingSpinner.module.css';

// Helper function for debug logging
const debugLog = (message: string) => console.debug(`[LoadingSpinner] ${message}`);

const LoadingSpinner: React.FC = () => {
  debugLog('Rendering loading spinner...');
  
  return (
    <div className={styles.loadingSpinnerContainer}>
      <Image 
        src={SDGWheel} 
        alt="Loading" 
        width={24} 
        height={24} 
        className={styles.loadingSpinner} 
      />
    </div>
  );
};

export default React.memo(LoadingSpinner);
