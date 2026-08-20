import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink-900 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute start-3 flex items-center pointer-events-none text-ink-400">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 px-3.5 bg-white text-ink-900 text-sm border rounded-md transition-colors placeholder:text-ink-400',
              'border-ink-200 focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-100',
              'disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed',
              error ? 'border-pink-600 focus-visible:ring-pink-100' : '',
              startIcon ? 'ps-10' : '',
              endIcon ? 'pe-10' : '',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {endIcon && (
            <div className="absolute end-3 flex items-center text-ink-400">
              {endIcon}
            </div>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-pink-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-ink-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
