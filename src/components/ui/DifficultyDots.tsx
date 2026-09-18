import React from 'react';
import { Difficulty } from '../../types';
import { cn } from '../../utils/cn';
import { DIFFICULTY_LABELS } from '../../config/categories';

interface DifficultyDotsProps {
  difficulty: Difficulty;
  className?: string;
  showLabel?: boolean;
}

export const DifficultyDots: React.FC<DifficultyDotsProps> = ({
  difficulty,
  className,
  showLabel = true,
}) => {
  const configs: Record<Difficulty, { level: number; label: string; dotColor: string }> = {
    easy: { level: 1, label: DIFFICULTY_LABELS.easy.label, dotColor: 'bg-sky-600' },
    beginner: { level: 1, label: DIFFICULTY_LABELS.easy.label, dotColor: 'bg-sky-600' },
    medium: { level: 2, label: DIFFICULTY_LABELS.medium.label, dotColor: 'bg-amber-600' },
    intermediate: { level: 2, label: DIFFICULTY_LABELS.medium.label, dotColor: 'bg-amber-600' },
    hard: { level: 3, label: DIFFICULTY_LABELS.hard.label, dotColor: 'bg-pink-600' },
    advanced: { level: 3, label: DIFFICULTY_LABELS.hard.label, dotColor: 'bg-pink-600' },
  };

  const config = configs[difficulty] || configs.easy;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-1" aria-label={`سطح ${config.label}`}>
        {[1, 2, 3].map((idx) => (
          <span
            key={idx}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              idx <= config.level ? config.dotColor : 'bg-ink-200'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-ink-600">{config.label}</span>
      )}
    </div>
  );
};
