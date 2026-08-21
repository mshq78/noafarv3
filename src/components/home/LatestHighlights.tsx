import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Wrench, Footprints, Calendar } from 'lucide-react';
import { CourseCard, ToolCard, ExperienceCard, EventCard } from '../cards';
import { Course, Tool, Experience, Event } from '../../types';
import { getContentList } from '../../services/endpoints';
import { Skeleton, Tabs } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

type HighlightTab = 'courses' | 'tools' | 'experiences' | 'events';

/** Which section each tab pulls its three highlight cards from. */
const TAB_SECTIONS = {
  courses: 'academy',
  tools: 'toolbox',
  experiences: 'journey',
  events: 'gathering',
} as const;

export const LatestHighlights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HighlightTab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  // Each tab fetches once, the first time it is opened.
  useEffect(() => {
    if (loadedTabs[activeTab]) return;
    let cancelled = false;
    const section = TAB_SECTIONS[activeTab];

    getContentList(section, { page: 1, pageSize: 3 })
      .then((result) => {
        if (cancelled) return;
        if (activeTab === 'courses') setCourses(result.items as unknown as Course[]);
        else if (activeTab === 'tools') setTools(result.items as unknown as Tool[]);
        else if (activeTab === 'experiences') setExperiences(result.items as unknown as Experience[]);
        else setEvents(result.items as unknown as Event[]);
      })
      .catch(() => {
        // A highlights strip that cannot load simply stays empty.
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white p-4 rounded-xl border border-ink-200 space-y-3">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
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
              جدیدترین‌های خانواده نوآفر
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

        {/* Dynamic Grid depending on active tab */}
        <div className="min-h-[400px]">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {tools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/toolbox"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors group"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {experiences.map((exp) => (
                      <ExperienceCard key={exp.id} experience={exp} />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/journey"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800 transition-colors group"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
                <div className="text-center pt-4">
                  <Link
                    to="/gathering"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors group"
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
