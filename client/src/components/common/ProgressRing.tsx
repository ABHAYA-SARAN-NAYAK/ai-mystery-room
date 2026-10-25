import React from 'react';

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  hintsUsed?: number;
  scorePreview?: number;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  current,
  total,
  size = 120,
  strokeWidth = 8,
  label = 'Clues',
  hintsUsed,
  scorePreview,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background dark ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1F1710"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground orange arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF6B1A"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl text-t1 tracking-wide leading-none">
            {current}/{total}
          </span>
          <span className="text-[11px] uppercase font-semibold text-t3 tracking-wider mt-0.5">
            {label}
          </span>
        </div>
      </div>

      {(hintsUsed !== undefined || scorePreview !== undefined) && (
        <div className="mt-4 pt-3 border-t border-line/60 w-full flex items-center justify-around text-xs">
          {hintsUsed !== undefined && (
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-t3 block">Hints Used</span>
              <span className="font-mono font-bold text-warning">{hintsUsed}</span>
            </div>
          )}
          {scorePreview !== undefined && (
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-t3 block">Score Est.</span>
              <span className="font-mono font-bold text-primary">{scorePreview} pts</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
