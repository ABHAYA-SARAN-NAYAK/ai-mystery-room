import React from 'react';
import { resolvePortrait, getSuspectRingColor } from '@mystery/shared';

interface SuspectAvatarProps {
  suspect: {
    id: string;
    name: string;
    gender?: 'male' | 'female' | 'other';
  };
  index?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SuspectAvatar: React.FC<SuspectAvatarProps> = ({
  suspect,
  index: explicitIndex,
  size = 'md',
  className = '',
}) => {
  // Extract number from id (e.g. "s1" -> 1)
  const numMatch = suspect.id.match(/\d+/);
  const suspectNumber = explicitIndex !== undefined ? explicitIndex + 1 : numMatch ? parseInt(numMatch[0], 10) : 1;
  const index = explicitIndex !== undefined ? explicitIndex : Math.max(0, suspectNumber - 1);
  const ringColor = getSuspectRingColor(index);

  // Even-numbered suspects flipped horizontally per SPEC 9.5 & 10.2 rule 9
  const isFlipped = suspectNumber % 2 === 0;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-xs',
    xl: 'w-7 h-7 text-sm font-bold',
  };

  const portraitUrl = resolvePortrait(suspect);

  return (
    <div className={`relative inline-block shrink-0 ${sizeClasses[size]} ${className}`}>
      <div
        className="w-full h-full rounded-full overflow-hidden bg-surface transition-transform"
        style={{
          border: `3px solid ${ringColor}`,
          boxShadow: `0 0 12px ${ringColor}33`,
        }}
      >
        <img
          src={portraitUrl}
          alt={`Suspect ${suspectNumber}: ${suspect.name}`}
          className="w-full h-full object-cover"
          style={{
            transform: isFlipped ? 'scaleX(-1)' : 'none',
          }}
          loading="lazy"
        />
      </div>

      {/* Number Badge at Bottom Right */}
      <span
        className={`absolute bottom-0 right-0 ${badgeSizeClasses[size]} rounded-full flex items-center justify-center font-bold text-onprimary shadow-md`}
        style={{ backgroundColor: ringColor }}
        title={`Suspect ${suspectNumber}`}
      >
        {suspectNumber}
      </span>
    </div>
  );
};
