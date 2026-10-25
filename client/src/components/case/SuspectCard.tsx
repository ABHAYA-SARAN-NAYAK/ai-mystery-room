import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PublicSuspect } from '@mystery/shared';
import { SuspectAvatar } from '../common/SuspectAvatar';

interface SuspectCardProps {
  suspect: PublicSuspect;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SuspectCard: React.FC<SuspectCardProps> = ({
  suspect,
  index,
  isSelected = false,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group w-full flex items-center justify-between p-3.5 rounded-card bg-surface border transition-all duration-200 cursor-pointer text-left select-none ${
        isSelected
          ? 'border-primary ring-1 ring-primary shadow-selected bg-raised'
          : 'border-line hover:border-line/80 hover:bg-raised/70'
      } ${className}`}
    >
      <div className="flex items-center space-x-3.5 min-w-0">
        <SuspectAvatar
          suspect={suspect}
          index={index}
          size="md"
          className="flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-lg text-t1 uppercase tracking-wide group-hover:text-primary transition-colors truncate">
            {suspect.name}
          </h4>
          <p className="text-xs text-t2 truncate font-medium">
            {suspect.occupation || 'Person of Interest'}
          </p>
          <p className="text-[11px] text-t3 truncate">
            {suspect.relationshipToVictim || 'Associated with case'}
          </p>
        </div>
      </div>

      <ChevronRight
        className={`w-5 h-5 flex-shrink-0 ml-2 transition-transform duration-200 ${
          isSelected ? 'text-primary translate-x-1' : 'text-t3 group-hover:text-t1 group-hover:translate-x-0.5'
        }`}
      />
    </div>
  );
};
