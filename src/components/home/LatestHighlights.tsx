import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Wrench,
  Footprints,
  Calendar,
  Clock,
  MapPin,
  Tag,
} from 'lucide-react';
import { Course, Tool, Experience, Event } from '../../types';
import { getContentList } from '../../services/endpoints';
import { Skeleton, Tabs } from '../ui';
import { SmartImage } from '../ui/SmartImage';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMinutes, toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';

type HighlightTab = 'courses' | 'tools' | 'experiences' | 'events';

const TAB_SECTIONS = {
  courses: 'academy',
  tools: 'toolbox',
  experiences: 'journey',
  events: 'gathering',
} as const;

/**
 * Section brand SVG fallback when no photo/illustration is provided.
 * Fully inline, colorful, zero external image requests.
 */
const HighlightIllustration: React.FC<{ section: string; color: string }> = ({
  section,
  color,
}) => {
  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}20 0%, ${color}45 100%)`,
      }}
    >
      <svg
        className="w-full h-full absolute inset-0 opacity-25 pointer-events-none"
        viewBox="0 0 400 225"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="112" r="90" stroke={color} strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="340" cy="40" r="60" fill={color} opacity="0.4" />
        <circle cx="50" cy="180" r="45" fill={color} opacity="0.3" />
        <path d="M-20 180 Q 150 60, 420 160" stroke={color} strokeWidth="2" strokeDasharray="4 4" />
      </svg>

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border border-white/60 relative z-10"
        style={{ backgroundColor: color }}
      >
        {section === 'academy' && <GraduationCap className="w-7 h-7 text-white" />}
        {section === 'toolbox' && <Wrench className="w-7 h-7 text-white" />}
        {section === 'journey' && <Footprints className="w-7 h-7 text-white" />}
        {section === 'gathering' && <Calendar className="w-7 h-7 text-white" />}
      </div>
    </div>
  );
};

interface UnifiedHighlightCardProps {
  title: string;
  summary: string;
  href: string;
  imageUrl?: string;
  section: 'academy' | 'toolbox' | 'journey' | 'gathering';
  badge?: string;
  metaText: string;
  metaIcon?: React.ReactNode;
}

const SECTION_CONFIG = {
  academy: {
    color: '#73CFED',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: <GraduationCap className="w-4 h-4 text-white" />,
    hoverBorder: 'hover:border-sky-300',
    hoverTitle: 'group-hover:text-sky-700',
  },
  toolbox: {
    color: '#FFCC6D',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <Wrench className="w-4 h-4 text-white" />,
    hoverBorder: 'hover:border-amber-300',
    hoverTitle: 'group-hover:text-amber-700',
  },
  journey: {
    color: '#ED3F86',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-200',
    icon: <Footprints className="w-4 h-4 text-white" />,
    hoverBorder: 'hover:border-pink-300',
    hoverTitle: 'group-hover:text-pink-700',
  },
  gathering: {
    color: '#73CFED',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: <Calendar className="w-4 h-4 text-white" />,
    hoverBorder: 'hover:border-sky-300',
    hoverTitle: 'group-hover:text-sky-700',
  },
};

const UnifiedHighlightCard: React.FC<UnifiedHighlightCardProps> = ({
  title,
  summary,
  href,
  imageUrl,
  section,
  badge,
  metaText,
  metaIcon,
}) => {
  const cfg = SECTION_CONFIG[section];

  return (
    <Link
      to={href}
      className={cn(
        'group flex flex-col h-full bg-white rounded-2xl border border-ink-200/90 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden',
        cfg.hoverBorder
      )}
    >
      {/* Upper 16:9 Colored Illustration / Image Block */}
      <div className="relative aspect-video w-full overflow-hidden bg-ink-100 shrink-0">
        {imageUrl ? (
          <SmartImage
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
            loading="lazy"
            fallbackSrc=""
          />
        ) : (
          <HighlightIllustration section={section} color={cfg.color} />
        )}

        {/* Optional small category badge inside image */}
        {badge && (
          <div className="absolute top-2.5 start-2.5">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs shadow-2xs bg-white/95',
                cfg.badgeClass
              )}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Small round icon sitting at bottom corner with section brand color (Mizito pattern) */}
        <div
          className="absolute -bottom-3.5 start-4 w-8 h-8 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-transform duration-300 group-hover:scale-110 z-10"
          style={{ backgroundColor: cfg.color }}
        >
          {cfg.icon}
        </div>
      </div>

      {/* Lower White Text Block (All cards equal height) */}
      <div className="p-4 sm:p-5 pt-5 flex-1 flex flex-col justify-between space-y-3 bg-white text-start">
        <div className="space-y-1.5">
          <h3
            className={cn(
              'text-sm sm:text-base font-bold text-ink-900 line-clamp-2 leading-snug transition-colors',
              cfg.hoverTitle
            )}
          >
            {title}
          </h3>
          <p className="text-xs text-ink-500 line-clamp-1 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Fine metadata row */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-500 font-medium pt-2.5 border-t border-ink-100/80">
          {metaIcon}
          <span className="truncate">{metaText}</span>
        </div>
      </div>
    </Link>
  );
};

export const LatestHighlights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HighlightTab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  // Fetch 4 items per tab to cleanly populate the 4-column grid
  useEffect(() => {
    if (loadedTabs[activeTab]) return;
    let cancelled = false;
    const section = TAB_SECTIONS[activeTab];

    getContentList(section, { page: 1, pageSize: 4 })
      .then((result) => {
        if (cancelled) return;
        if (activeTab === 'courses') setCourses(result.items as unknown as Course[]);
        else if (activeTab === 'tools') setTools(result.items as unknown as Tool[]);
        else if (activeTab === 'experiences') setExperiences(result.items as unknown as Experience[]);
        else setEvents(result.items as unknown as Event[]);
      })
      .catch(() => {
        // Fallback gracefully on empty state
      })
      .finally(() => {
        if (!cancelled) setLoadedTabs((prev) => ({ ...prev, [activeTab]: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, loadedTabs]);

  const isTabLoading = !loadedTabs[activeTab];

  const skeletonGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-ink-200/90 overflow-hidden shadow-2xs space-y-3 flex flex-col h-full"
        >
          <div className="relative aspect-video w-full bg-ink-100">
            <Skeleton className="w-full h-full rounded-none" />
            <div className="absolute -bottom-3.5 start-4 w-8 h-8 rounded-full bg-ink-200 border-2 border-white" />
          </div>
          <div className="p-4 pt-5 space-y-2 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
            </div>
            <Skeleton className="h-3 w-1/2 pt-2" />
          </div>
        </div>
      ))}
    </div>
  );

  const tabs = [
    { id: 'courses', label: 'دوره‌های آموزشی', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'tools', label: 'بوم‌ها و کاربرگ‌ها', icon: <Wrench className="w-4 h-4" /> },
    { id: 'experiences', label: 'تازه‌ترین تجربیات', icon: <Footprints className="w-4 h-4" /> },
    { id: 'events', label: 'رویدادها و کارگاه‌ها', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Heading + Tab controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              گزیده محتوا
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
              جدیدترین‌های نوآفر
            </h2>
          </div>

          <div className="overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as HighlightTab)}
              variant="pills"
            />
          </div>
        </div>

        {/* 4-column desktop, 2-column tablet, 1-column mobile Grid */}
        <div className="min-h-[380px]">
          <AnimatePresence mode="wait">
            {activeTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {isTabLoading ? (
                  skeletonGrid
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {courses.map((course) => (
                      <UnifiedHighlightCard
                        key={course.id}
                        title={course.title}
                        summary={course.summary}
                        href={`/academy/${course.slug}`}
                        imageUrl={course.heroImage?.url || course.posterUrl}
                        section="academy"
                        badge={course.category?.nameFa}
                        metaText={
                          course.durationMinutes
                            ? `${toFaDigits(course.durationMinutes)} دقیقه آموزش`
                            : course.level || 'دوره آموزشی'
                        }
                        metaIcon={<Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/academy"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800 transition-colors group"
                  >
                    <span>مشاهده همه دوره‌های آکادمی</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}

            {activeTab === 'tools' && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {isTabLoading ? (
                  skeletonGrid
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {tools.map((tool) => (
                      <UnifiedHighlightCard
                        key={tool.id}
                        title={tool.title}
                        summary={tool.summary}
                        href={`/toolbox/${tool.slug}`}
                        imageUrl={tool.heroImage?.url || tool.previewSvgUrl}
                        section="toolbox"
                        badge={tool.stage?.nameFa}
                        metaText={
                          tool.estimatedMinutes
                            ? `زمان تقریبی: ${toFaDigits(tool.estimatedMinutes)} دقیقه`
                            : 'ابزار تعاملی'
                        }
                        metaIcon={<Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/toolbox"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors group"
                  >
                    <span>مشاهده همه بوم‌ها و کاربرگ‌ها</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}

            {activeTab === 'experiences' && (
              <motion.div
                key="experiences"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {isTabLoading ? (
                  skeletonGrid
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {experiences.map((exp) => (
                      <UnifiedHighlightCard
                        key={exp.id}
                        title={exp.title}
                        summary={exp.summary}
                        href={`/journey/${exp.slug}`}
                        imageUrl={exp.heroImage?.url}
                        section="journey"
                        badge={exp.field?.nameFa}
                        metaText={
                          exp.year
                            ? `سال ${toFaDigits(exp.year)} ${exp.region ? `• ${exp.region}` : ''}`
                            : exp.region || 'روایت تجارب میدانی'
                        }
                        metaIcon={<MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
                      />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/journey"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-700 hover:text-pink-800 transition-colors group"
                  >
                    <span>مشاهده همه تجربیات میدانی</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {isTabLoading ? (
                  skeletonGrid
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {events.map((event) => (
                      <UnifiedHighlightCard
                        key={event.id}
                        title={event.title}
                        summary={event.summary}
                        href={`/gathering/${event.slug}`}
                        imageUrl={event.heroImage?.url}
                        section="gathering"
                        badge={
                          event.status === 'upcoming'
                            ? 'پیش‌رو'
                            : event.status === 'registering'
                            ? 'در حال ثبت‌نام'
                            : 'برگزار شده'
                        }
                        metaText={
                          event.startsAt
                            ? new Date(event.startsAt).toLocaleDateString('fa-IR')
                            : 'رویداد و کارگاه'
                        }
                        metaIcon={<Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/gathering"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800 transition-colors group"
                  >
                    <span>مشاهده همه رویدادها و کارگاه‌ها</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
