import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, User } from 'lucide-react';
import { Course } from '../../types';
import { DifficultyDots, ProgressBar, Chip } from '../ui';
import { formatMinutes, toFaDigits } from '../../utils/format';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const hasProgress = (course.myProgressPercent || 0) > 0;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200">
      {/* Cover Image & Badges */}
      <Link
        to={`/academy/${course.slug}`}
        className="relative aspect-video bg-ink-100 overflow-hidden block"
      >
        <img
          src={course.heroImage?.url || '/mock/course-thumb.svg'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 start-2.5">
          {course.category && (
            <Chip size="sm" variant="sky" className="bg-white/95 backdrop-blur-xs font-semibold">
              {course.category.nameFa}
            </Chip>
          )}
        </div>
        <div className="absolute bottom-2.5 end-2.5 bg-ink-950/75 backdrop-blur-xs text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-sans">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatMinutes(course.durationMinutes)}</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <Link to={`/academy/${course.slug}`}>
            <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-sky-700 transition-colors leading-snug">
              {course.title}
            </h3>
          </Link>
          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            {course.summary}
          </p>
        </div>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-2 pt-2 border-t border-ink-100">
            {course.instructor.avatarUrl ? (
              <img
                src={course.instructor.avatarUrl}
                alt={course.instructor.name}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-ink-800 truncate">
                {course.instructor.name}
              </p>
              {course.instructor.affiliation && (
                <p className="text-[11px] text-ink-400 truncate">
                  {course.instructor.affiliation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Meta info: Level and Lessons */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-100 text-xs text-ink-500">
          <DifficultyDots difficulty={course.difficulty} />
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-ink-400" />
            <span>{toFaDigits(course.lessonsCount)} درس</span>
          </div>
        </div>

        {/* Progress Bar (if ongoing) */}
        {hasProgress && (
          <div className="pt-2 border-t border-ink-100">
            <ProgressBar percent={course.myProgressPercent || 0} showLabel height="sm" />
          </div>
        )}
      </div>
    </div>
  );
};
