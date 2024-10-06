// File: components/organisms/Tools.tsx

import React, { useState } from 'react';
import '../../styles/components/organisms/Tools.css'; // Import the CSS file

interface ToolsProps {
  messages: string[];
}

const Tools: React.FC<ToolsProps> = ({ messages }) => {
  const [isIframeVisible, setIframeVisible] = useState(false);

  // Toggle the visibility of the iframe modal
  const toggleIframe = () => {
    setIframeVisible(!isIframeVisible);
  };

  return (
    <div className="tools-container">
      {/* Conditionally render "Tools" or strikethrough "Close" button at the right-most part of the left panel */}
      <button
        className={`right-edge-button ${isIframeVisible ? 'close-button-active' : ''}`}
        onClick={toggleIframe}
      >
        {isIframeVisible ? <s>Tools</s> : 'Tools'}
      </button>

      {/* Layered Modal with the Iframe */}
      {isIframeVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <iframe
              src="https://www.local2030.org/discover-tools"
              width="100%"
              height="100%"
              className="translucent-iframe"
              title="Local2030 Toolbox"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
