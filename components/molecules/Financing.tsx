// File: components/molecules/Financing.tsx

import React from 'react';
import styles from '../../styles/components/molecules/ToolLink.module.css';

const Financing: React.FC = () => {
  return (
    <div className={styles.toolLink}>
      <a href="https://jointsdgfund.org/sdg-financing" target="_blank" rel="noopener noreferrer">
        Financing
      </a>
    </div>
  );
};

export default Financing;
