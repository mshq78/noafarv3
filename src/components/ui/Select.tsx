import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, placeholder, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-ink-900 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-11 px-3.5 pe-10 bg-white text-ink-900 text-sm border rounded-md transition-colors appearance-none cursor-pointer',
              'border-ink-200 focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-100',
              'disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed',
              error ? 'border-pink-600 focus-visible:ring-pink-100' : '',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-pink-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-xs text-ink-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
