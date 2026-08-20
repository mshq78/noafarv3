import React from 'react';
import { cn } from '../../utils/cn';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Mandatory for accessibility
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      children,
      size = 'md',
      variant = 'ghost',
      disabled = false,
      'aria-label': ariaLabel,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-8 h-8 rounded-md p-1.5',
      md: 'w-10 h-10 rounded-md p-2',
      lg: 'w-12 h-12 rounded-lg p-2.5',
    };

    const variantClasses = {
      primary: 'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-700',
      accent: 'bg-pink-300 text-ink-900 hover:bg-pink-600 hover:text-white',
      secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
      ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-900',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center transition-colors select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
