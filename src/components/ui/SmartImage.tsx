import React, { useEffect, useState } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  /** Shown when `src` is missing or fails to load. */
  fallbackSrc?: string;
}

/**
 * An `<img>` that degrades gracefully: a missing or unreachable image swaps to
 * a local placeholder instead of leaving the browser's broken-image icon and
 * sprawling alt text across the card.
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc = '/mock/course-thumb.svg',
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
};
