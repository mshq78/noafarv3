import React from 'react';

interface TricolorRuleProps {
  className?: string;
  /** Total height of the rule in pixels. */
  height?: number;
}

/**
 * The three brand colours as one rule. The bands are laid out with a hard-stop
 * gradient rather than three sub-pixel divs, which used to blur into a single
 * muddy line at the 4px default height.
 */
export const TricolorRule: React.FC<TricolorRuleProps> = ({ className = '', height = 4 }) => {
  // Three bands need at least 1px each to stay distinguishable; below 3px
  // they blend into a single muddy line.
  const safeHeight = Math.min(Math.max(height, 3), 12);

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`w-full select-none overflow-hidden rounded-full ${className}`}
      style={{
        height: `${safeHeight}px`,
        backgroundImage:
          'linear-gradient(to bottom, #73CFED 0 33.33%, #FFCC6D 33.33% 66.66%, #ED3F86 66.66% 100%)',
      }}
    />
  );
};
