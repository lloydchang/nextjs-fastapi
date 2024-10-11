// File: components/organisms/LoadingSpinner.tsx

import React from 'react';
import Image from 'next/image';
import SDGWheel from 'public/images/SDGWheel.png';
import styles from 'styles/components/organisms/LoadingSpinner.module.css';

const LoadingSpinner: React.FC = () => (
  <div className={styles.loadingSpinnerContainer}>
    {/* Added unoptimized property to the Image component */}
    <Image 
      src={SDGWheel} 
      alt="Loading" 
      width={24} 
      height={24} 
      className={styles.loadingSpinner} 
      unoptimized // Prevents optimization for this image
    />
  </div>
);

export default React.memo(LoadingSpinner);
