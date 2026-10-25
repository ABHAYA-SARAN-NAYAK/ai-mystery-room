import React, { useEffect } from 'react';
import { AssetId, asset } from '@mystery/shared';

interface PageBackgroundProps {
  bgId: AssetId;
  children: React.ReactNode;
  className?: string;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  bgId,
  children,
  className = '',
}) => {
  const bgUrl = asset(bgId, 1920);

  useEffect(() => {
    // Dynamic preloader for the current background
    const existing = document.querySelector(`link[data-bg="${bgId}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = bgUrl;
      link.setAttribute('data-bg', bgId);
      document.head.appendChild(link);
    }
  }, [bgId, bgUrl]);

  return (
    <div
      className={`page-bg flex flex-col justify-between ${className}`}
      style={{ '--bg-url': `url('${bgUrl}')` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
