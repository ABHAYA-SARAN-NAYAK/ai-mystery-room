import React from 'react';
import { Difficulty } from '@mystery/shared';
import { Shield, ShieldAlert, Skull } from 'lucide-react';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
  showIcon?: boolean;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  className = '',
  showIcon = true,
}) => {
  const configs = {
    easy: {
      label: 'Easy',
      bg: 'bg-success-bg text-success border-success/40',
      icon: Shield,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-primary-soft text-primary border-primary/40',
      icon: ShieldAlert,
    },
    hard: {
      label: 'Hard',
      bg: 'bg-danger-bg text-danger border-danger/40',
      icon: Skull,
    },
  };

  const { label, bg, icon: Icon } = configs[difficulty] || configs.medium;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${bg} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </span>
  );
};
