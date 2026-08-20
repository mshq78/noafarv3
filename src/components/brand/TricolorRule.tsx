import React from 'react';

interface TricolorRuleProps {
  className?: string;
}

export const TricolorRule: React.FC<TricolorRuleProps> = ({ className = '' }) => {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`w-full flex flex-col h-1 select-none overflow-hidden ${className}`}
    >
      <div className="h-[1.33px] w-full bg-[#73CFED]" /> {/* sky-300 */}
      <div className="h-[1.33px] w-full bg-[#FFCC6D]" /> {/* amber-300 */}
      <div className="h-[1.34px] w-full bg-[#ED3F86]" /> {/* pink-300 */}
    </div>
  );
};
