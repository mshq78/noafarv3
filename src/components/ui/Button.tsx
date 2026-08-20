import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // 2x horizontal padding rule enforced: py-2 px-4, py-2.5 px-5, py-3 px-6
    const sizeClasses = {
      sm: 'py-1.5 px-3 text-[13px] rounded-md gap-1.5 h-8',
      md: 'py-2.5 px-5 text-[15px] rounded-md gap-2 h-11',
      lg: 'py-3.5 px-7 text-[16px] rounded-lg gap-2.5 h-13',
    };

    const variantClasses = {
      // Primary: sky-600 with white text, hover sky-700
      primary:
        'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-700 focus-visible:ring-sky-600 shadow-sm',
      // Secondary/emphasis: pink-300 with ink-900 text, hover pink-600 with white text
      accent:
        'bg-pink-300 text-ink-900 hover:bg-pink-600 hover:text-white active:bg-pink-700 active:text-white focus-visible:ring-pink-300 shadow-sm font-medium',
      // Secondary: ink-200 outline / border
      secondary:
        'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 focus-visible:ring-ink-300',
      // Ghost
      ghost:
        'bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 focus-visible:ring-ink-300',
      // Danger
      danger:
        'bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-700 focus-visible:ring-pink-600',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
