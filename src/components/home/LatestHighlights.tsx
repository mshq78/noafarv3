import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Wrench, Footprints, Calendar } from 'lucide-react';
import { CourseCard, ToolCard, ExperienceCard, EventCard } from '../cards';
import { MOCK_COURSES, MOCK_TOOLS, MOCK_EXPERIENCES, MOCK_EVENTS } from '../../mocks';
import { Tabs } from '../ui';

export const LatestHighlights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'tools' | 'experiences' | 'events'>('courses');

  const tabs = [
    { id: 'courses', label: 'دوره‌های آموزشی منتخب', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'tools', label: 'بوم‌های پرکاربرد', icon: <Wrench className="w-4 h-4" /> },
    { id: 'experiences', label: 'تازه‌ترین تجربیات محلی', icon: <Footprints className="w-4 h-4" /> },
    { id: 'events', label: 'رویدادها و کارگاه‌ها', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Heading + Tab controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              گزیده محتوا
            </span>
            <h2 className="text-2xl font-black text-ink-900">
              جدیدترین‌های خانواده نوآفر
            </h2>
          </div>

          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            variant="pills"
          />
        </div>

        {/* Dynamic Grid depending on active tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_COURSES.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/academy"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800"
              >
                <span>مشاهده همه ۳۴ دوره آکادمی</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_TOOLS.slice(0, 3).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/toolbox"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700"
              >
                <span>مشاهده همه ۲۸ بوم و کاربرگ</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'experiences' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_EXPERIENCES.slice(0, 3).map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/journey"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800"
              >
                <span>مشاهده همه ۴۲ تجربه میدانی</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_EVENTS.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="text-center pt-2">
              <Link
                to="/gathering"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700"
              >
                <span>مشاهده همه رویدادها و گزارش‌ها</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
