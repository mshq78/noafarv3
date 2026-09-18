import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SECTION_LIST } from '../../config/sections';
import { SectionMeta } from '../../types';
import { cn } from '../../utils/cn';

/**
 * Inline vector illustration for each portal:
 * Large symbolic geometry + icon + geometric background shapes.
 * All pure vector (SVG), self-contained, no external images.
 */
const PortalIllustration: React.FC<{ slug: string; accentColor: string }> = ({
  slug,
  accentColor,
}) => {
  switch (slug) {
    case 'academy':
      // Graduation Cap & Learning circles
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Decorative geometric background */}
          <circle cx="100" cy="100" r="75" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="100" cy="100" r="50" fill={accentColor} opacity="0.12" />
          <line x1="25" y1="100" x2="175" y2="100" stroke={accentColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.3" />
          <line x1="100" y1="25" x2="100" y2="175" stroke={accentColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.3" />
          {/* Graduation Cap Vector */}
          <g transform="translate(50, 55)">
            <path
              d="M50 15L95 38L50 61L5 38L50 15Z"
              fill={accentColor}
              fillOpacity="0.85"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M25 50V75C25 88 75 88 75 75V50"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M80 46V72C80 75 83 78 86 78C89 78 92 75 92 72V46"
              fill={accentColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle cx="86" cy="80" r="3" fill="#0f172a" />
          </g>
        </svg>
      );

    case 'toolbox':
      // Wrench & Geometric layout
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="35" y="35" width="130" height="130" rx="20" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
          <circle cx="100" cy="100" r="48" fill={accentColor} opacity="0.15" />
          <line x1="30" y1="170" x2="170" y2="30" stroke={accentColor} strokeWidth="1.5" opacity="0.25" />
          {/* Wrench Vector */}
          <g transform="translate(60, 60)">
            <path
              d="M62 18A24 24 0 0 0 38 4L28 14L42 28L30 40L16 26L6 36A24 24 0 0 0 20 60L54 74L74 54L62 18Z"
              fill={accentColor}
              fillOpacity="0.85"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="28" r="4" fill="#0f172a" />
          </g>
        </svg>
      );

    case 'spark':
      // Sparkles & Ideas
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="70" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="100" cy="100" r="42" fill={accentColor} opacity="0.15" />
          <line x1="100" y1="15" x2="100" y2="45" stroke={accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="100" y1="155" x2="100" y2="185" stroke={accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="15" y1="100" x2="45" y2="100" stroke={accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="155" y1="100" x2="185" y2="100" stroke={accentColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          {/* Central Star Sparkle */}
          <g transform="translate(65, 65)">
            <path
              d="M35 5C35 22 22 35 5 35C22 35 35 48 35 65C35 48 48 35 65 35C48 35 35 22 35 5Z"
              fill={accentColor}
              fillOpacity="0.9"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="15" cy="15" r="3" fill="#0f172a" />
            <circle cx="55" cy="55" r="2.5" fill="#0f172a" />
          </g>
        </svg>
      );

    case 'gathering':
      // Users & Community Networking
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="68" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="100" cy="85" r="45" fill={accentColor} opacity="0.12" />
          {/* Connection arcs */}
          <path d="M45 140C55 115 145 115 155 140" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
          {/* Community Avatars */}
          <g transform="translate(50, 48)">
            {/* Center Leader */}
            <circle cx="50" cy="30" r="16" fill={accentColor} stroke="#0f172a" strokeWidth="2.5" />
            <path d="M26 78C26 62 38 52 50 52C62 52 74 62 74 78" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            {/* Left Member */}
            <circle cx="20" cy="40" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <path d="M5 80C5 68 14 60 22 60" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            {/* Right Member */}
            <circle cx="80" cy="40" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <path d="M95 80C95 68 86 60 78 60" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'library':
      // Open Book & Resource Pages
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="40" y="30" width="120" height="140" rx="14" stroke={accentColor} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />
          <circle cx="100" cy="100" r="50" fill={accentColor} opacity="0.15" />
          <line x1="30" y1="100" x2="170" y2="100" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
          {/* Open Book Vector */}
          <g transform="translate(50, 60)">
            <path
              d="M50 25C38 18 20 18 5 22V70C20 66 38 66 50 72C62 66 80 66 95 70V22C80 18 62 18 50 25Z"
              fill={accentColor}
              fillOpacity="0.85"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <line x1="50" y1="25" x2="50" y2="72" stroke="#0f172a" strokeWidth="2.5" />
            <line x1="18" y1="36" x2="38" y2="36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="46" x2="38" y2="46" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <line x1="62" y1="36" x2="82" y2="36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <line x1="62" y1="46" x2="82" y2="46" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'journey':
      // Footprints & Compass / Trail
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="70" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <circle cx="100" cy="100" r="46" fill={accentColor} opacity="0.12" />
          {/* Trail path */}
          <path
            d="M35 150Q70 120 100 135T165 70"
            stroke={accentColor}
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Footprints / Trail steps */}
          <g transform="translate(56, 52)">
            {/* Foot 1 */}
            <g transform="translate(15, 45) rotate(-15)">
              <ellipse cx="14" cy="20" rx="9" ry="14" fill={accentColor} stroke="#0f172a" strokeWidth="2" />
              <circle cx="8" cy="3" r="2.5" fill="#0f172a" />
              <circle cx="14" cy="2" r="2.5" fill="#0f172a" />
              <circle cx="20" cy="4" r="2" fill="#0f172a" />
            </g>
            {/* Foot 2 */}
            <g transform="translate(48, 15) rotate(15)">
              <ellipse cx="14" cy="20" rx="9" ry="14" fill={accentColor} stroke="#0f172a" strokeWidth="2" />
              <circle cx="8" cy="4" r="2" fill="#0f172a" />
              <circle cx="14" cy="2" r="2.5" fill="#0f172a" />
              <circle cx="20" cy="3" r="2.5" fill="#0f172a" />
            </g>
          </g>
        </svg>
      );

    default:
      return null;
  }
};

interface ShowcaseCardProps {
  section: SectionMeta;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ section }) => {
  const isComingSoon = section.comingSoon;

  const content = (
    <div
      className={cn(
        'w-full h-full flex flex-col justify-between p-4 sm:p-5 relative rounded-2xl border text-start overflow-hidden select-none',
        'aspect-[3/4] transition-all duration-400 ease-out motion-reduce:transition-none motion-reduce:transform-none',
        isComingSoon
          ? 'bg-ink-100/80 border-ink-200 opacity-60 filter grayscale cursor-not-allowed'
          : 'bg-white border-ink-200/90 filter grayscale contrast-85 hover:grayscale-0 hover:contrast-100 hover:border-ink-300 hover:shadow-md hover:-translate-y-1.5 focus-visible:grayscale-0 focus-visible:contrast-100 focus-visible:-translate-y-1.5'
      )}
      style={{
        // Dynamic soft tint background applied behind illustration
        backgroundColor: isComingSoon ? undefined : undefined,
      }}
    >
      {/* Upper Vector Illustration */}
      <div className="w-full flex-1 flex items-center justify-center relative py-2">
        <div className="w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-400 group-hover:scale-105 motion-reduce:transform-none">
          <PortalIllustration
            slug={section.slug}
            accentColor={section.accentColorHex || '#73CFED'}
          />
        </div>
      </div>

      {/* Lower Details */}
      <div className="pt-3 border-t border-ink-100/70 space-y-2 relative z-10">
        <h3 className="text-base sm:text-lg font-black text-ink-900 leading-tight">
          {section.nameFa}
        </h3>

        {isComingSoon ? (
          <div className="pt-1">
            <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-ink-200 text-ink-600">
              به زودی
            </span>
          </div>
        ) : (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-ink-50 text-ink-700 border border-ink-200/70 group-hover:bg-ink-900 group-hover:text-white group-hover:border-ink-900 transition-colors">
              <span>بیشتر بدانید</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (isComingSoon) {
    return (
      <div
        className="w-[68vw] max-w-[210px] shrink-0 md:w-auto snap-center"
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/${section.slug}`}
      className="group block w-[68vw] max-w-[210px] shrink-0 md:w-auto snap-center outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      {content}
    </Link>
  );
};

export const SectionShowcase: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header note */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block mb-1">
              درگاه‌های تخصصی
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
              مسیرهای نوآوری و حل مسئله
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-500 max-w-md leading-relaxed">
            شش درگاه اختصاصی برای گام‌به‌گام طراحی، یادگیری و اجرای راهکارهای تحول‌آفرین
          </p>
        </div>

        {/* 6 Cards row: Desktop 6-col, Tablet 3-col, Mobile horizontal snap scroll */}
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory py-2 px-1 sm:px-0 scroll-smooth">
          {SECTION_LIST.map((sec) => (
            <ShowcaseCard key={sec.slug} section={sec} />
          ))}
        </div>
      </div>
    </section>
  );
};
