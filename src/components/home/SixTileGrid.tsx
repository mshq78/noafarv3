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
import { motion } from 'framer-motion';

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
      activeBg: 'bg-sky-700 text-white',
      hoverBg: 'hover:bg-sky-700 hover:text-white',
      iconBg: 'bg-sky-50 text-sky-700',
      activeIconBg: 'bg-white/20 text-white',
      hoverIconBg: 'group-hover:bg-white/20 group-hover:text-white',
      accentText: 'text-sky-700',
    },
    pink: {
      cardBorder: 'hover:border-pink-500',
      activeBg: 'bg-pink-600 text-white',
      hoverBg: 'hover:bg-pink-600 hover:text-white',
      iconBg: 'bg-pink-50 text-pink-700',
      activeIconBg: 'bg-white/20 text-white',
      hoverIconBg: 'group-hover:bg-white/20 group-hover:text-white',
      accentText: 'text-pink-600',
    },
    amber: {
      cardBorder: 'hover:border-amber-500',
      activeBg: 'bg-amber-600 text-white',
      hoverBg: 'hover:bg-amber-600 hover:text-white',
      iconBg: 'bg-amber-50 text-amber-800',
      activeIconBg: 'bg-white/20 text-white',
      hoverIconBg: 'group-hover:bg-white/20 group-hover:text-white',
      accentText: 'text-amber-800',
    },
  };

  const theme = colorThemes[section.colorFamily] || colorThemes.sky;

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Link
        ref={ref}
        to={`/${section.slug}`}
        className={cn(
          'group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-all duration-300 overflow-hidden',
          'bg-white border-ink-200 shadow-2xs hover:shadow-lg',
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
            `whitespace-nowrap` kept this heading on one line at every width.
            On a phone the line is ~455px wide inside a ~350px column, which
            pushed the whole document 74px sideways. It stays on one line from
            `sm` up, where there is room for it.
          */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 leading-tight text-balance sm:whitespace-nowrap">
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
