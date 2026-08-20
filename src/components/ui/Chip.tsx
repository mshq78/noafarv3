import React from 'react';
import { cn } from '../../utils/cn';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'sky' | 'pink' | 'amber' | 'ink';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  selected = false,
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs h-6',
    md: 'px-3 py-1 text-[13px] h-7',
  };

  const variantClasses = {
    default: selected
      ? 'bg-ink-900 text-white border-ink-900'
      : 'bg-ink-100 text-ink-700 border-ink-200 hover:bg-ink-200',
    sky: selected
      ? 'bg-sky-600 text-white border-sky-600'
      : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100',
    pink: selected
      ? 'bg-pink-600 text-white border-pink-600'
      : 'bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100',
    amber: selected
      ? 'bg-amber-600 text-white border-amber-600'
      : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
    ink: 'bg-ink-50 text-ink-700 border-ink-200',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium border whitespace-nowrap select-none transition-colors',
        onClick ? 'cursor-pointer' : '',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
