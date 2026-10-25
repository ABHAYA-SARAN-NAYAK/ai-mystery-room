import React, { useEffect } from 'react';
import { AssetId, asset } from '@mystery/shared';

export interface PageBackgroundProps {
  bgId: AssetId;
  children: React.ReactNode;
  className?: string;
  overlayTop?: number;
  overlayBottom?: number;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  bgId,
  children,
  className = '',
  overlayTop,
  overlayBottom,
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

  const styleObj: Record<string, string> = {
    '--bg-url': `url('${bgUrl}')`,
  };
  if (overlayTop !== undefined) {
    styleObj['--bg-overlay-top'] = String(overlayTop);
  }
  if (overlayBottom !== undefined) {
    styleObj['--bg-overlay-bottom'] = String(overlayBottom);
  }

  return (
    <div
      className={`page-bg flex flex-col justify-between ${className}`}
      style={styleObj as React.CSSProperties}
    >
      {children}
    </div>
  );
};
