import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'sky' | 'pink' | 'amber';

/** Saturated brand gradients with white text; `line` is the light accent for the shapes. */
const TONES: Record<Tone, { bg: string; bgEnd: string; line: string }> = {
  sky: { bg: '#0ea1cf', bgEnd: '#065e7c', line: '#def4fc' },
  pink: { bg: '#d9256e', bgEnd: '#830c3b', line: '#fce4ed' },
  amber: { bg: '#d48a17', bgEnd: '#874c07', line: '#fef4db' },
};
const TONE_ORDER: Tone[] = ['sky', 'pink', 'amber'];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * One calm shape per cover on a 120×160 canvas, kept to a corner so the title
 * stays easy to read. The shapes are soft fills rather than busy line work.
 */
function renderPattern(variant: number, line: string): React.ReactNode {
  const soft = { fill: line, opacity: 0.16 } as const;
  const ring = { fill: 'none', stroke: line, strokeWidth: 1.5, opacity: 0.35 } as const;
  switch (variant) {
    case 0: // two large circles
      return (
        <>
          <circle cx={118} cy={150} r={62} {...soft} />
          <circle cx={118} cy={150} r={34} {...ring} />
        </>
      );
    case 1: // a diagonal band
      return (
        <>
          <path d="M120 0V70L50 160H0Z" {...soft} opacity={0.12} />
          <line x1={120} y1={48} x2={30} y2={160} {...ring} />
        </>
      );
    case 2: // one big diamond
      return (
        <>
          <path d="M100 8L148 56L100 104L52 56Z" {...soft} />
          <path d="M100 32L124 56L100 80L76 56Z" {...ring} />
        </>
      );
    case 3: // rising half-circle
      return (
        <>
          <path d="M-10 160A70 70 0 0 1 130 160Z" {...soft} />
          <path d="M20 160A40 40 0 0 1 100 160" {...ring} />
        </>
      );
    case 4: // stepped corner
      return (
        <>
          <rect x={52} y={0} width={68} height={68} {...soft} />
          <rect x={80} y={0} width={40} height={40} {...ring} />
        </>
      );
    default: // small dot cluster
      return Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={70 + (i % 4) * 14} cy={14 + Math.floor(i / 4) * 14} r={2.4} fill={line} opacity={0.5} />
      ));
  }
}

export interface GeneratedCoverProps {
  title?: string;
  /** Stable value (slug or id) that picks the colour and the line work. */
  seed: string;
  /** Hide the title when the surrounding page already shows it. */
  showTitle?: boolean;
  className?: string;
}

/**
 * A cover drawn from the brand palette for items that have no image of their
 * own. Colour and pattern come from `seed`, so a given item always looks the
 * same and neighbouring cards differ.
 */
export const GeneratedCover: React.FC<GeneratedCoverProps> = ({ title, seed, showTitle = true, className }) => {
  const hash = hashSeed(seed);
  const tone = TONES[TONE_ORDER[hash % TONE_ORDER.length]];
  const variant = Math.floor(hash / 3) % 6;

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={{ background: `linear-gradient(155deg, ${tone.bg}, ${tone.bgEnd})`, containerType: 'inline-size' }}
      role="img"
      aria-label={title}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 120 160"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {renderPattern(variant, tone.line)}
      </svg>
      {showTitle && title && (
        <div className="absolute inset-0 flex items-center px-[8cqw] py-[16cqw]">
          <p
            className="font-bold leading-snug line-clamp-4 text-start text-white"
            style={{ fontSize: 'clamp(13px, 7cqw, 24px)', textShadow: '0 1px 4px rgba(0,0,0,.25)' }}
          >
            {title}
          </p>
        </div>
      )}
    </div>
  );
};

/** True when `url` points to a real upload rather than a design-time placeholder. */
export function isRealImage(url?: string | null): url is string {
  return !!url && !url.startsWith('/mock/');
}

interface CoverImageProps {
  src?: string | null;
  alt: string;
  seed: string;
  showTitle?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * Shows the item's own image when it has one, and a generated brand cover
 * otherwise (including when the image fails to load).
 */
export const CoverImage: React.FC<CoverImageProps> = ({ src, alt, seed, showTitle = true, className, imgClassName }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!isRealImage(src) || failed) {
    return <GeneratedCover title={alt} seed={seed} showTitle={showTitle} className={className} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('w-full h-full object-cover', imgClassName)}
      onError={() => setFailed(true)}
    />
  );
};
