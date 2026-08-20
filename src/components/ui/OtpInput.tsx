import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { toEnDigits, toFaDigits } from '../../utils/format';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 5,
  value = '',
  onChange,
  error = false,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first empty box on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, val: string) => {
    const rawChar = toEnDigits(val).slice(-1);
    if (!/^\d*$/.test(rawChar)) return;

    const otpArray = value.split('');
    // Fill up to length
    while (otpArray.length < length) otpArray.push('');

    otpArray[index] = rawChar;
    const newOtp = otpArray.join('').slice(0, length);
    onChange(newOtp);

    // Auto advance to next box
    if (rawChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = toEnDigits(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 dir-rtl" dir="rtl">
      {Array.from({ length }).map((_, idx) => {
        const char = value[idx] || '';
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char ? toFaDigits(char) : ''}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold font-sans rounded-lg border bg-white transition-all',
              'focus-visible:outline-none focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-100',
              error
                ? 'border-pink-600 focus-visible:ring-pink-100 text-pink-700'
                : 'border-ink-300 text-ink-900',
              disabled ? 'bg-ink-100 cursor-not-allowed text-ink-400' : ''
            )}
            aria-label={`رقم ${idx + 1}`}
          />
        );
      })}
    </div>
  );
};
