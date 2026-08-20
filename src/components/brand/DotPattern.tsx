import React from 'react';

interface DotPatternProps {
  className?: string;
  opacity?: number; // 0.06 to 0.10
  color?: string; // default ink-900 or section color
  patternId?: string;
}

export const DotPattern: React.FC<DotPatternProps> = ({
  className = '',
  opacity = 0.08,
  color = '#0A0A0A',
  patternId = 'noafar-dot-pattern',
}) => {
  const safeOpacity = Math.min(Math.max(opacity, 0.04), 0.12);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity: safeOpacity }}
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          {/* Diamond pattern of dots */}
          <circle cx="24" cy="6" r="2.2" fill={color} />
          <circle cx="12" cy="18" r="2.2" fill={color} />
          <circle cx="36" cy="18" r="2.2" fill={color} />
          <circle cx="6" cy="24" r="2.2" fill={color} />
          <circle cx="24" cy="24" r="2.2" fill={color} />
          <circle cx="42" cy="24" r="2.2" fill={color} />
          <circle cx="12" cy="30" r="2.2" fill={color} />
          <circle cx="36" cy="30" r="2.2" fill={color} />
          <circle cx="24" cy="42" r="2.2" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};
