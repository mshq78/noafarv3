import React from 'react';
import { Link } from 'react-router-dom';
import { NoafarMark } from './NoafarMark';
import { useSiteSettings } from '../../hooks/useSiteSettings';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  markAccent?: string;
  className?: string;
  showText?: boolean;
  /**
   * Marks the logo as sitting on a dark background. The wordmark is an SVG
   * image, so the caller supplies the colour treatment through `className`
   * (the footer already does); this only records the intent.
   */
  invert?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  markAccent = '#FFCC6D',
  className = '',
  showText = true,
  invert: _invert = false,
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
          className={`${textHeights[size]} w-auto object-contain select-none`}
        />
      </Link>
    );
  }

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
