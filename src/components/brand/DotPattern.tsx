import React, { useId } from 'react';

interface DotPatternProps {
  className?: string;
  /** Clamped to a subtle 0.04–0.12 range. */
  opacity?: number;
  /** Dot colour; pass the section's accent to tint the pattern. */
  color?: string;
  /** Alias of `color`, kept for call sites that use the section vocabulary. */
  dotColor?: string;
  patternId?: string;
}

/**
 * Decorative dot texture. Each instance gets its own pattern id, so several
 * patterns on one page no longer collide on a shared `<defs>` id and all
 * render in the first one's colour.
 */
export const DotPattern: React.FC<DotPatternProps> = ({
  className = '',
  opacity = 0.08,
  color,
  dotColor,
  patternId,
}) => {
  const generatedId = useId().replace(/:/g, '');
  const id = patternId ?? `noafar-dots-${generatedId}`;
  const fill = dotColor ?? color ?? '#0A0A0A';
  const safeOpacity = Math.min(Math.max(opacity, 0.04), 0.12);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity: safeOpacity }}
    >
      <defs>
        <pattern id={id} x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          {/* Diamond pattern of dots */}
          <circle cx="24" cy="6" r="2.2" fill={fill} />
          <circle cx="12" cy="18" r="2.2" fill={fill} />
          <circle cx="36" cy="18" r="2.2" fill={fill} />
          <circle cx="6" cy="24" r="2.2" fill={fill} />
          <circle cx="24" cy="24" r="2.2" fill={fill} />
          <circle cx="42" cy="24" r="2.2" fill={fill} />
          <circle cx="12" cy="30" r="2.2" fill={fill} />
          <circle cx="36" cy="30" r="2.2" fill={fill} />
          <circle cx="24" cy="42" r="2.2" fill={fill} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};
