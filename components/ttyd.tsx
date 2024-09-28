// components/ttyd.tsx
import React from 'react';

const Ttyd: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        src="http://localhost:8080"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default Ttyd;
