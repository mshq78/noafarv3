import React from 'react';
import { SubmissionStatus } from '../../types';
import { cn } from '../../utils/cn';

interface StatusChipProps {
  status: SubmissionStatus;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const configs: Record<SubmissionStatus, { label: string; classes: string }> = {
    pending: {
      label: 'در انتظار بررسی',
      classes: 'bg-amber-50 text-amber-700 border-amber-300',
    },
    approved: {
      label: 'تأیید شده',
      classes: 'bg-sky-50 text-sky-600 border-sky-300',
    },
    rejected: {
      label: 'رد شده',
      classes: 'bg-pink-50 text-pink-700 border-pink-300',
    },
    needs_revision: {
      label: 'نیازمند اصلاح',
      classes: 'bg-ink-100 text-ink-700 border-ink-300',
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap select-none',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
};
