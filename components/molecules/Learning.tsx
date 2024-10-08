// File: components/molecules/Learning.tsx

import React from 'react';
import styles from '../../styles/components/molecules/ToolLink.module.css';

const Learning: React.FC = () => {
  return (
    <div className={styles.toolLink}>
      <a href="https://www.unsdglearn.org/learning/" target="_blank" rel="noopener noreferrer">
        Learning
      </a>
    </div>
  );
};

export default Learning;
