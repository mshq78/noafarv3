import React from 'react';

interface NoafarMarkProps {
  size?: number | string;
  accent?: string;
  className?: string;
  animate?: boolean;
}

export const NoafarMark: React.FC<NoafarMarkProps> = ({
  size = 40,
  accent = '#FFCC6D', // amber-300
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
        cy="8"
        r="7.5"
        fill={accent}
        className={animate ? 'animate-[bounce_0.8s_ease-out_0.4s_1_normal_both]' : ''}
        style={animate ? { animationFillMode: 'both' } : undefined}
      />
      {/* The eight dots forming Persian Nun (ن) */}
      <g className={animate ? 'animate-[fadeIn_0.4s_ease-out_both]' : ''}>
        <circle cx="36" cy="30" r="9.5" fill="currentColor" />
        <circle cx="64" cy="30" r="9.5" fill="currentColor" />
        <circle cx="21" cy="50" r="9.5" fill="currentColor" />
        <circle cx="50" cy="50" r="9.5" fill="currentColor" />
        <circle cx="79" cy="50" r="9.5" fill="currentColor" />
        <circle cx="36" cy="70" r="9.5" fill="currentColor" />
        <circle cx="64" cy="70" r="9.5" fill="currentColor" />
        <circle cx="50" cy="90" r="9.5" fill="currentColor" />
      </g>
    </svg>
  );
};
