import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Lock,
  Volume2,
  Maximize2,
  FileText,
  Clock,
  Award,
} from 'lucide-react';
import { Course, CourseLesson } from '../../types';
import { ProgressBar, Button } from '../ui';
import { updateCourseProgress } from '../../services/endpoints';
import { useToast } from '../ui/Toast';
import { formatMinutes, toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';

interface CoursePlayerProps {
  course: Course;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course }) => {
  const { showToast } = useToast();
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(course.myProgressPercent || 0);

  const currentLesson = course.syllabus?.[activeLessonIndex] || {
    id: 'les-default',
    title: course.title,
    durationMinutes: course.durationMinutes,
  };

  const handleLessonSelect = (index: number) => {
    setActiveLessonIndex(index);
    setIsPlaying(true);
  };

  const handleMarkCompleted = async () => {
    const totalLessons = course.syllabus?.length || 1;
    const newPercent = Math.min(
      100,
      Math.round(((activeLessonIndex + 1) / totalLessons) * 100)
    );
    setProgressPercent(newPercent);
    await updateCourseProgress(course.id, newPercent);
    showToast(`درس «${currentLesson.title}» تکمیل شد! (+۴۰ امتیاز نوآفری)`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Video Player & Lessons List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-ink-950 rounded-2xl overflow-hidden shadow-xl border border-ink-800 text-white">
        {/* Main Video Screen (2 cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between aspect-video bg-ink-900 relative group overflow-hidden">
          {/* Simulated Video Frame */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-ink-950 via-ink-900 to-ink-900/80">
            <img
              src={course.heroImage?.url || '/mock/course-thumb.svg'}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            {/* Play/Pause Large Central Trigger */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-sky-600/90 text-white hover:bg-sky-500 flex items-center justify-center shadow-lg transition-transform hover:scale-110 relative z-10 cursor-pointer"
              aria-label={isPlaying ? 'توقف ویدیو' : 'پخش ویدیو'}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ms-1" />}
            </button>
          </div>

          {/* Top Video Title */}
          <div className="relative z-10 p-4 bg-gradient-to-b from-ink-950/80 to-transparent flex items-center justify-between">
            <div>
              <span className="text-xs text-sky-400 font-bold block">
                درس {toFaDigits(activeLessonIndex + 1)} از {toFaDigits(course.lessonsCount)}
              </span>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {currentLesson.title}
              </h3>
            </div>
            <span className="text-xs text-ink-300 font-sans">
              {formatMinutes(currentLesson.durationMinutes)}
            </span>
          </div>

          {/* Bottom Player Controls */}
          <div className="relative z-10 p-4 bg-gradient-to-t from-ink-950/90 to-transparent space-y-2">
            {/* Progress Slider */}
            <div className="w-full bg-ink-700 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div
                className="bg-sky-500 h-full transition-all"
                style={{ width: `${isPlaying ? 45 : 15}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-ink-300">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <Volume2 className="w-4 h-4" />
                <span className="font-sans">۰۲:۱۵ / ۱۰:۰۰</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={handleMarkCompleted}
                  rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  className="h-7 text-xs py-0"
                >
                  تکمیل و درس بعدی
                </Button>
                <Maximize2 className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Playlist Sidebar (1 col) */}
        <div className="p-4 bg-ink-900 flex flex-col justify-between border-t lg:border-t-0 lg:border-s border-ink-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h4 className="text-sm font-bold text-white">سرفصل‌های آموزشی</h4>
              <span className="text-xs text-ink-400 font-sans">
                {toFaDigits(course.lessonsCount)} درس
              </span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pe-1 scrollbar-thin">
              {(course.syllabus || []).map((lesson, idx) => {
                const isActive = idx === activeLessonIndex;
                const isPassed = idx < activeLessonIndex;

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleLessonSelect(idx)}
                    className={cn(
                      'w-full text-start p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer',
                      isActive
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-ink-800/60 text-ink-300 hover:bg-ink-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : isActive ? (
                        <Play className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <span className="text-[11px] text-ink-500 shrink-0 font-sans">
                          {toFaDigits(idx + 1)}.
                        </span>
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>

                    <span className="text-[10px] opacity-75 shrink-0 font-sans">
                      {formatMinutes(lesson.durationMinutes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Summary at bottom of playlist */}
          <div className="pt-4 border-t border-ink-800 space-y-2">
            <ProgressBar percent={progressPercent} showLabel color="sky" height="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
