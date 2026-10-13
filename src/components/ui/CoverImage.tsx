import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'sky' | 'pink' | 'amber';

/**
 * Light brand tints: cards sit desaturated until hovered, so a pale cover
 * stays airy at rest and turns into the brand colour on hover.
 */
const TONES: Record<Tone, { bg: string; bgEnd: string; line: string; text: string }> = {
  sky: { bg: '#def4fc', bgEnd: '#bee9f8', line: '#0ea1cf', text: '#0a4c64' },
  pink: { bg: '#fce4ed', bgEnd: '#f9cadc', line: '#d9256e', text: '#6c0d32' },
  amber: { bg: '#fef4db', bgEnd: '#fde3b3', line: '#d48a17', text: '#6f3c0b' },
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

/** Simple geometric line work on a 120×160 canvas, clipped by the card. */
function renderPattern(variant: number, line: string): React.ReactNode {
  const common = { fill: 'none', stroke: line, strokeWidth: 1.2, opacity: 0.4 } as const;
  switch (variant) {
    case 0: // concentric circles from the lower corner
      return [18, 36, 54, 72, 90, 108].map((r) => <circle key={r} cx={120} cy={160} r={r} {...common} />);
    case 1: // diagonal lines
      return Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={-20 + i * 16} y1={160} x2={60 + i * 16} y2={0} {...common} />
      ));
    case 2: // grid of diamonds
      return Array.from({ length: 5 * 7 }, (_, i) => {
        const x = 12 + (i % 5) * 24;
        const y = 12 + Math.floor(i / 5) * 24;
        return <path key={i} d={`M${x} ${y - 7}L${x + 7} ${y}L${x} ${y + 7}L${x - 7} ${y}Z`} {...common} />;
      });
    case 3: // overlapping half-circles (scales)
      return Array.from({ length: 6 * 8 }, (_, i) => {
        const row = Math.floor(i / 6);
        const x = (i % 6) * 24 + (row % 2 ? 12 : 0);
        const y = row * 14 + 14;
        return <path key={i} d={`M${x - 12} ${y}A12 12 0 0 1 ${x + 12} ${y}`} {...common} />;
      });
    case 4: // nested squares
      return [20, 40, 60, 80, 100].map((s) => (
        <rect key={s} x={120 - s} y={0} width={s} height={s} {...common} />
      ));
    default: // dotted grid
      return Array.from({ length: 6 * 8 }, (_, i) => (
        <circle key={i} cx={10 + (i % 6) * 20} cy={10 + Math.floor(i / 6) * 20} r={2} fill={line} opacity={0.4} />
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
      style={{ background: `linear-gradient(160deg, ${tone.bg}, ${tone.bgEnd})`, containerType: 'inline-size' }}
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
            className="font-bold leading-snug line-clamp-4 text-start"
            style={{ fontSize: 'clamp(13px, 7cqw, 24px)', color: tone.text }}
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
