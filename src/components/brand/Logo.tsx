import React from 'react';
import { Link } from 'react-router-dom';
import { NoafarMark } from './NoafarMark';
import { useSiteSettings } from '../../hooks/useSiteSettings';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  markAccent?: string;
  className?: string;
  showText?: boolean;
  /** Renders the wordmark light, for use on a dark background (the footer). */
  invert?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  markAccent = '#FFCC6D',
  className = '',
  showText = true,
  invert = false,
}) => {
  // In the supplied artwork the mark and the logotype are the same height and
  // sit about 0.18 of that height apart, so the two scales move together.
  const markSizes = {
    sm: 24,
    md: 32,
    lg: 44,
  };

  const textHeights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-11',
  };

  const settings = useSiteSettings();

  if (settings?.logoUrl) {
    return (
      <Link
        to="/"
        id="brand-logo-link"
        className={`inline-flex items-center text-ink-900 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md ${className}`}
        aria-label="بازگشت به صفحه اصلی"
      >
        <img
          src={settings.logoUrl}
          alt="لوگوی سایت"
          className={`${textHeights[size]} w-auto object-contain select-none${
            invert ? ' brightness-0 invert' : ''
          }`}
        />
      </Link>
    );
  }

  return (
    <Link
      to="/"
      id="brand-logo-link"
      className={`inline-flex items-center gap-1.5 text-ink-900 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md ${className}`}
      aria-label="نوآفر - بازگشت به صفحه اصلی"
    >
      <NoafarMark
        size={markSizes[size]}
        accent={markAccent}
        // On the dark footer the pink cluster loses contrast, so the dots
        // there follow the surrounding text colour instead.
        body={invert ? 'currentColor' : undefined}
      />
      {showText && (
        <img
          src="/brand/noafar-logotype.svg"
          alt="لوگوتایپ نوآفر"
          className={`${textHeights[size]} w-auto select-none${
            invert ? ' brightness-0 invert' : ''
          }`}
        />
      )}
    </Link>
  );
};
