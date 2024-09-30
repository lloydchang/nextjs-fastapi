// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from './MiddlePanel.module.css';
import dynamic from 'next/dynamic';

// Dynamically import heavy components (if any)
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

// TypeScript Types
type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const initialKeyword = useRef<string>("TED AI");

  const [query, setQuery
