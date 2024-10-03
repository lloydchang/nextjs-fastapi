import React from 'react';

const ttyd: React.FC = () => {
  return (
    <div>
      <iframe
        src="http://localhost:8080"
        style={{ width: '100vw', height: '100vh', border: 'none' }}
      />
    </div>
  );
};

export default ttyd;
