import React from 'react';
import { Link } from 'react-router-dom';
import { NoafarMark } from './NoafarMark';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  markAccent?: string;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  markAccent = '#FFCC6D',
  className = '',
  showText = true,
}) => {
  const markSizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const textHeights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-11',
  };

  return (
    <Link
      to="/"
      id="brand-logo-link"
      className={`inline-flex items-center gap-3 text-ink-900 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md ${className}`}
      aria-label="نوآفر - بازگشت به صفحه اصلی"
    >
      <NoafarMark size={markSizes[size]} accent={markAccent} />
      {showText && (
        <img
          src="/brand/noafar-logotype.svg"
          alt="لوگوتایپ نوآفر"
          className={`${textHeights[size]} w-auto select-none`}
        />
      )}
    </Link>
  );
};
