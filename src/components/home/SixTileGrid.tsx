import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { SECTION_LIST } from '../../config/sections';
import { ICON_MAP } from '../../config/sectionIcons';
import { SectionMeta } from '../../types';
import { useInViewColor } from '../../hooks/useInViewColor';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface TileProps {
  section: SectionMeta;
  index: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const SectionTile: React.FC<TileProps> = ({ section }) => {
  const { ref, isInView } = useInViewColor<HTMLAnchorElement>();

  /**
   * The active state paints the tile in the portal's own brand colour — the
   * 300 step, which is the exact hex from the logo — and keeps the text in
   * ink, because all three brand colours are light enough that white type
   * would fall under the contrast floor while ink clears it comfortably.
   *
   * Every class is written out in full, including its `hover:` /
   * `group-hover:` variants. Tailwind scans the source for literal class
   * names, so a class assembled at runtime (the previous
   * `'hover:' + theme.activeBg`) produced no CSS at all — and, because the
   * concatenation only prefixed the first class, `text-white` also escaped its
   * hover state and left white titles on white cards.
   */
  const colorThemes: Record<
    string,
    {
      cardBorder: string;
      activeBg: string;
      hoverBg: string;
      iconBg: string;
      activeIconBg: string;
      hoverIconBg: string;
      accentText: string;
    }
  > = {
    sky: {
      cardBorder: 'hover:border-sky-500',
      activeBg: 'bg-sky-300 text-ink-900',
      hoverBg: 'hover:bg-sky-300 hover:text-ink-900',
      iconBg: 'bg-sky-50 text-sky-700',
      activeIconBg: 'bg-white/70 text-sky-700',
      hoverIconBg: 'group-hover:bg-white/70 group-hover:text-sky-700',
      accentText: 'text-sky-700',
    },
    pink: {
      cardBorder: 'hover:border-pink-500',
      activeBg: 'bg-pink-300 text-ink-900',
      hoverBg: 'hover:bg-pink-300 hover:text-ink-900',
      iconBg: 'bg-pink-50 text-pink-700',
      activeIconBg: 'bg-white/80 text-pink-600',
      hoverIconBg: 'group-hover:bg-white/80 group-hover:text-pink-600',
      accentText: 'text-pink-600',
    },
    amber: {
      cardBorder: 'hover:border-amber-500',
      activeBg: 'bg-amber-300 text-ink-900',
      hoverBg: 'hover:bg-amber-300 hover:text-ink-900',
      iconBg: 'bg-amber-50 text-amber-800',
      activeIconBg: 'bg-white/70 text-amber-800',
      hoverIconBg: 'group-hover:bg-white/70 group-hover:text-amber-800',
      accentText: 'text-amber-800',
    },
  };

  const theme = colorThemes[section.colorFamily] || colorThemes.sky;

  if (section.comingSoon) {
    return (
      <motion.div variants={itemVariants} className="h-full">
        <div
          aria-disabled="true"
          className="tile-desaturate-locked relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-ink-200 bg-white/80 shadow-2xs opacity-65 cursor-not-allowed select-none overflow-hidden"
        >
          {/* Background Section Mark/Watermark */}
          <div className="absolute -bottom-8 -start-8 opacity-5 pointer-events-none transform -rotate-12 scale-150 text-ink-400">
            {ICON_MAP[section.iconName] || <GraduationCap className="w-32 h-32" />}
          </div>

          <div className="space-y-4 relative z-10">
            {/* Top: Icon + Section Key */}
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
                {ICON_MAP[section.iconName]}
              </div>

              <span className="text-xs font-bold uppercase tracking-wider font-sans text-ink-400 opacity-60">
                {section.slug}
              </span>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-ink-800">
                {section.nameFa}
              </h3>
              {section.taglineFa ? (
                <p className="text-xs font-semibold text-ink-400">
                  {section.taglineFa}
                </p>
              ) : null}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm leading-relaxed text-ink-500">
              {section.descriptionFa}
            </p>
          </div>

          {/* Bottom Label: به‌زودی instead of "ورود به ..." and arrow */}
          <div className="pt-6 mt-4 border-t border-ink-100 flex items-center justify-between relative z-10 text-xs font-bold">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold">
              به‌زودی
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Link
        ref={ref}
        to={`/${section.slug}`}
        className={cn(
          'group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-all duration-300 overflow-hidden',
          'bg-white border-ink-200 shadow-2xs hover:shadow-lg',
          // Grey until pointed at, then the portal's own colour arrives.
          'tile-desaturate',
          theme.cardBorder,
          isInView ? theme.activeBg : theme.hoverBg
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
                theme.hoverIconBg
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
                // The active tile is painted in a light brand colour, so the
                // secondary text stays in ink rather than going white.
                'text-xs font-semibold transition-colors',
                isInView ? 'text-ink-800' : theme.accentText,
                'group-hover:text-ink-800'
              )}
            >
              {section.taglineFa}
            </p>
          </div>

          {/* Description */}
          <p
            className={cn(
              'text-xs sm:text-sm leading-relaxed transition-colors',
              isInView ? 'text-ink-800' : 'text-ink-500',
              'group-hover:text-ink-800'
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
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const SixTileGrid: React.FC = () => {
  return (
    <section id="six-sections-grid" className="py-16 sm:py-20 bg-ink-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Section Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center space-y-3 max-w-4xl mx-auto px-4"
        >
          <span className="text-xs font-bold text-sky-700 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            نقشه جامع پلتفرم
          </span>
          {/*
            No `whitespace-nowrap`: it forced this heading onto one line at
            every width, and on a phone that line is ~455px inside a ~350px
            column, which pushed the whole document sideways. The text fits on
            one line unaided from `md` up and wraps below that, so pinning it
            only ever risked overflow.
          */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 leading-tight text-balance">
            شش درگاه تخصصی برای مسیر رشد نوآوری شما
          </h2>
          <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-xl mx-auto whitespace-normal">
            از یادگیری مبانی تا آزمودن بوم‌ها، مطالعه کتب، مشاهده تجربیات واقعی و ارائه ایده‌های نو.
          </p>
        </motion.div>

        {/* 2x3 or 3x2 Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {SECTION_LIST.map((section, idx) => (
            <SectionTile key={section.slug} section={section} index={idx} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
