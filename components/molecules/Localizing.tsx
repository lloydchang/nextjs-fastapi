// File: components/molecules/Localizing.tsx

import React from 'react';
import styles from '../../styles/components/molecules/ToolLink.module.css';

const Localizing: React.FC = () => {
  return (
    <div className={styles.toolLink}>
      <a href="https://www.local2030.org/discover-tools" target="_blank" rel="noopener noreferrer">
        Localizing
      </a>
    </div>
  );
};

export default Localizing;
