// components/atoms/ActionButton.tsx
import React, { CSSProperties } from 'react';

type ActionButtonProps = {
  text?: string;
  backgroundColor?: string; // New prop for button background color
  color?: string; // Foreground (text) color
  onClick?: () => void;
  className?: string; // Allow external CSS class overrides
  style?: CSSProperties; // Allow inline style overrides
  children?: React.ReactNode; // Allow nested children like icons or custom elements
};

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  backgroundColor = '#000000', // Default background color
  color = '#FFFFFF', // Default foreground (text) color
  onClick,
  className = '',
  style = {},
  children,
}) => {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        cursor: 'pointer',
        textAlign: 'center',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: style.backgroundColor || backgroundColor, // Prioritize custom background color in style
        color: style.color || color, // Prioritize custom text color in style
        fontWeight: 'bold',
        ...style, // Merge custom styles
      }}
    >
      {/* Render custom children if provided, else render text */}
      {children ? children : text}
    </button>
  );
};

export default ActionButton;
