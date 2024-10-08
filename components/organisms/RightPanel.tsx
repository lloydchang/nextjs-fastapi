// File: components/organisms/RightPanel.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../state/context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../../public/images/SDGWheel.png';
import styles from '../../styles/components/organisms/RightPanel.module.css';
import { useChatContext } from '../state/context/ChatContext';
import axios from 'axios';
import { Talk } from '../state/types';

const RightPanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const { sendActionToChatbot } = useChatContext();
  const initialKeyword = useRef<string>("");
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      performSearch(initialKeyword.current);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={`${styles.rightPanel} ${styles['right-panel']}`}>
      {/* Content */}
    </div>
  );
};

export default React.memo(RightPanel);
