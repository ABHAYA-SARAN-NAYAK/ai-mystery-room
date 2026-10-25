import React from 'react';

interface RubberStampProps {
  text: string;
  variant?: 'solved' | 'failed' | 'file';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  text,
  variant = 'file',
  className = '',
  size = 'md',
}) => {
  const variantStyles = {
    solved: 'stamp-solved',
    failed: 'stamp-failed',
    file: 'stamp-file',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 border-2',
    md: 'text-base px-3.5 py-1 border-[3px]',
    lg: 'text-2xl px-5 py-2 border-4',
  };

  return (
    <div
      className={`rubber-stamp ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      role="status"
    >
      {text}
    </div>
  );
};
