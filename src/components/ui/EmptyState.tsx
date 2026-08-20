import React from 'react';
import { SearchX } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-dashed border-ink-200 my-6',
        className
      )}
    >
      <div className="p-4 bg-ink-50 text-ink-400 rounded-full mb-4">
        {icon || <SearchX className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-ink-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
