import React from 'react';

interface NoafarMarkProps {
  size?: number | string;
  /** Colour of the detached top dot. Defaults to the brand amber. */
  accent?: string;
  /**
   * Colour of the eight cluster dots. Defaults to the brand pink; pass
   * `currentColor` to let the mark take the surrounding text colour, which is
   * what a dark background wants.
   */
  body?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Geometry measured off the supplied brand artwork: nine equal dots
 * (r = 11.72) on a diamond lattice with a 19.14 step, the topmost one detached
 * in the accent colour. Kept as markup rather than an <img> so the two colours
 * stay themeable and the dots can animate.
 */
const CLUSTER: readonly [number, number][] = [
  [30.86, 30.86],
  [69.14, 30.86],
  [11.72, 50],
  [50, 50],
  [88.28, 50],
  [30.86, 69.14],
  [69.14, 69.14],
  [50, 88.28],
];

const DOT_RADIUS = 11.72;

export const NoafarMark: React.FC<NoafarMarkProps> = ({
  size = 40,
  accent = '#FFCC6D',
  body = '#ED3F86',
  className = '',
  animate = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* The detached ninth dot — always the accent color */}
      <circle
        cx="50"
        cy="11.72"
        r={DOT_RADIUS}
        fill={accent}
        className={animate ? 'animate-[bounce_0.8s_ease-out_0.4s_1_normal_both]' : ''}
        style={animate ? { animationFillMode: 'both' } : undefined}
      />
      <g className={animate ? 'animate-[fadeIn_0.4s_ease-out_both]' : ''} fill={body}>
        {CLUSTER.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={DOT_RADIUS} />
        ))}
      </g>
    </svg>
  );
};
