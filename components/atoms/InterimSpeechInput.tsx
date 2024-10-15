// File: components/atoms/InterimSpeechInput.tsx

import React from 'react';
import styles from 'styles/components/atoms/InterimSpeechInput.module.css';

interface InterimSpeechInputProps {
  interimSpeech: string;
}

const InterimSpeechInput: React.FC<InterimSpeechInputProps> = ({ interimSpeech }) => {
  return (
    <div className={styles.interimContainer}>
      <textarea
        value={interimSpeech}
        readOnly
        className={styles.interimTextarea}
        placeholder="Listening..."
        rows={2}
      />
    </div>
  );
};

export default React.memo(InterimSpeechInput);
