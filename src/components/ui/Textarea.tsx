import React from 'react';
import { cn } from '../../utils/cn';
import { toFaDigits } from '../../utils/format';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  minChars?: number;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharCount = false,
      minChars,
      maxChars,
      value,
      defaultValue,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-')}` : undefined);
    const textLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-start">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-ink-900 select-none"
            >
              {label}
            </label>
          )}
          {showCharCount && (
            <span className="text-xs text-ink-400 font-sans">
              {minChars && textLength < minChars ? (
                <span className="text-amber-700">
                  {toFaDigits(textLength)} / حداقل {toFaDigits(minChars)} نویسه
                </span>
              ) : maxChars ? (
                <span className={textLength > maxChars ? 'text-pink-600 font-bold' : ''}>
                  {toFaDigits(textLength)} / {toFaDigits(maxChars)} نویسه
                </span>
              ) : (
                `${toFaDigits(textLength)} نویسه`
              )}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            'w-full min-h-[120px] p-3.5 bg-white text-ink-900 text-sm border rounded-md transition-colors placeholder:text-ink-400 leading-relaxed',
            'border-ink-200 focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-100',
            'disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed',
            error ? 'border-pink-600 focus-visible:ring-pink-100' : '',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} role="alert" className="text-xs text-pink-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-xs text-ink-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
