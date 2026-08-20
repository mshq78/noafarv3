import React from 'react';
import { cn } from '../../utils/cn';
import { toFaDigits } from '../../utils/format';

interface ProgressBarProps {
  percent: number; // 0 - 100
  showLabel?: boolean;
  color?: 'sky' | 'pink' | 'amber';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent = 0,
  showLabel = false,
  color = 'sky',
  height = 'md',
  className,
}) => {
  const clamped = Math.min(Math.max(percent, 0), 100);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    sky: 'bg-sky-600',
    pink: 'bg-pink-600',
    amber: 'bg-amber-600',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-ink-600">
          <span>میزان پیشرفت</span>
          <span className="font-sans font-bold">{toFaDigits(clamped)}٪</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-ink-100 rounded-full overflow-hidden',
          heightClasses[height]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
