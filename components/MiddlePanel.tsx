// components/MiddlePanel.tsx
"use client";

import React from 'react';
import Ttyd from './ttyd';

const Panel: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h1>Creative AI Agents at TEDx</h1>
      <Ttyd />
    </div>
  );
};

export default Panel;
