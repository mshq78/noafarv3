import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Wrench,
  BookOpen,
  Footprints,
  Users,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { SECTION_LIST } from '../../config/sections';
import { SectionMeta } from '../../types';
import { useInViewColor } from '../../hooks/useInViewColor';
import { cn } from '../../utils/cn';

// Icon map for the 6 sections
const ICON_MAP: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-7 h-7" />,
  Wrench: <Wrench className="w-7 h-7" />,
  BookOpen: <BookOpen className="w-7 h-7" />,
  Footprints: <Footprints className="w-7 h-7" />,
  Users: <Users className="w-7 h-7" />,
  Sparkles: <Sparkles className="w-7 h-7" />,
};

interface TileProps {
  section: SectionMeta;
  index: number;
}

const SectionTile: React.FC<TileProps> = ({ section }) => {
  const { ref, isInView } = useInViewColor<HTMLAnchorElement>();

  // Color classes for active/hover states
  const colorThemes: Record<
    string,
    {
      cardBorder: string;
      activeBg: string;
      iconBg: string;
      activeIconBg: string;
      accentText: string;
    }
  > = {
    sky: {
      cardBorder: 'hover:border-sky-500',
      activeBg: 'bg-sky-700 text-white',
      iconBg: 'bg-sky-50 text-sky-700',
      activeIconBg: 'bg-white/20 text-white',
      accentText: 'text-sky-700',
    },
    pink: {
      cardBorder: 'hover:border-pink-500',
      activeBg: 'bg-pink-600 text-white',
      iconBg: 'bg-pink-50 text-pink-700',
      activeIconBg: 'bg-white/20 text-white',
      accentText: 'text-pink-600',
    },
    amber: {
      cardBorder: 'hover:border-amber-500',
      activeBg: 'bg-amber-600 text-white',
      iconBg: 'bg-amber-50 text-amber-800',
      activeIconBg: 'bg-white/20 text-white',
      accentText: 'text-amber-800',
    },
  };

  const theme = colorThemes[section.colorFamily] || colorThemes.sky;

  return (
    <Link
      ref={ref}
      to={`/${section.slug}`}
      className={cn(
        'group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-all duration-300 overflow-hidden',
        'bg-white border-ink-200 shadow-2xs hover:shadow-lg',
        theme.cardBorder,
        isInView ? theme.activeBg : 'hover:' + theme.activeBg
      )}
    >
      {/* Background Section Mark/Watermark */}
      <div className="absolute -bottom-8 -start-8 opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none transform -rotate-12 scale-150">
        {ICON_MAP[section.iconName] || <GraduationCap className="w-32 h-32" />}
      </div>

      <div className="space-y-4 relative z-10">
        {/* Top: Icon + Section Key */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'p-3 rounded-xl transition-colors duration-200',
              isInView ? theme.activeIconBg : theme.iconBg,
              'group-hover:' + theme.activeIconBg
            )}
          >
            {ICON_MAP[section.iconName]}
          </div>

          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider font-sans opacity-60'
            )}
          >
            {section.slug}
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-black transition-colors">
            {section.nameFa}
          </h3>
          <p
            className={cn(
              'text-xs font-semibold transition-colors opacity-90',
              isInView ? 'text-white' : theme.accentText,
              'group-hover:text-white'
            )}
          >
            {section.taglineFa}
          </p>
        </div>

        {/* Description */}
        <p
          className={cn(
            'text-xs sm:text-sm leading-relaxed transition-colors',
            isInView ? 'text-white/90' : 'text-ink-500',
            'group-hover:text-white/95'
          )}
        >
          {section.descriptionFa}
        </p>
      </div>

      {/* Bottom Link Action */}
      <div className="pt-6 mt-4 border-t border-current/15 flex items-center justify-between relative z-10 text-xs font-bold">
        <span>ورود به {section.nameFa}</span>
        <div className="flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

export const SixTileGrid: React.FC = () => {
  return (
    <section id="six-sections-grid" className="py-16 sm:py-20 bg-ink-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-sky-700 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            نقشه جامع پلتفرم
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
            شش درگاه تخصصی برای مسیر رشد نوآوری شما
          </h2>
          <p className="text-sm text-ink-500 leading-relaxed">
            از یادگیری مبانی تا آزمودن بوم‌ها، مطالعه کتب، مشاهده تجربیات واقعی و ارائه ایده‌های نو.
          </p>
        </div>

        {/* 2x3 or 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTION_LIST.map((section, idx) => (
            <SectionTile key={section.slug} section={section} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};
