import React from 'react';
import NextLink from 'next/link';

interface LinkRendererProps {
  href?: string;
  children?: React.ReactNode;
}

const LinkRenderer: React.FC<LinkRendererProps> = ({ href, children, ...props }) => {
  const isInternal = href && href.startsWith('/');

  if (isInternal) {
    return (
      <NextLink href={href} legacyBehavior>
        <a {...props}>{children}</a>
      </NextLink>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};

export default LinkRenderer;