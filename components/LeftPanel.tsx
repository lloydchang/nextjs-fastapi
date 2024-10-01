// components/LeftPanel.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import BackgroundImage from '../public/TEDxSDG.jpg';
import ChatInterface from './ChatInterface';
import styles from '../styles/LeftPanel.module.css';

const LeftPanel: React.FC = () => {
  return (
    <div className={styles.container}>
      <Image src={BackgroundImage} alt="Background" fill className={styles.backgroundImage} />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>
          <b>Ideas Change Everything!</b>
        </h1>
        <ChatInterface />
      </div>
    </div>
  );
};

export default React.memo(LeftPanel);
