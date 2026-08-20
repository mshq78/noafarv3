import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Video, Users, FileText, ArrowLeft } from 'lucide-react';
import { Event } from '../../types';
import { Chip } from '../ui';
import { formatPersianDate } from '../../utils/date';
import { cn } from '../../utils/cn';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const isPast = event.status === 'past';
  const isWorkshop = event.kind === 'workshop';

  return (
    <div
      className={cn(
        'group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs transition-all duration-200',
        isPast
          ? 'hover:border-ink-300'
          : 'hover:shadow-md hover:border-pink-300'
      )}
    >
      {/* Cover Image & Badges */}
      <Link
        to={`/gathering/${event.slug}`}
        className="relative aspect-[16/9] bg-ink-100 overflow-hidden block"
      >
        <img
          src={event.heroImage.url}
          alt={event.title}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            isPast ? 'grayscale-30 group-hover:grayscale-0' : 'group-hover:scale-103'
          )}
          loading="lazy"
        />

        {/* Status chip */}
        <div className="absolute top-2.5 start-2.5">
          {isPast ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-ink-100/95 text-ink-700 backdrop-blur-xs border border-ink-200">
              برگزار شده
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-pink-600 text-white shadow-xs animate-pulse">
              در حال ثبت‌نام
            </span>
          )}
        </div>

        {/* Kind Chip */}
        <div className="absolute top-2.5 end-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-xs text-ink-800 shadow-2xs">
            {isWorkshop ? (
              <Users className="w-3.5 h-3.5 text-pink-600" />
            ) : (
              <Video className="w-3.5 h-3.5 text-sky-600" />
            )}
            <span>{isWorkshop ? 'کارگاه حضوری' : 'وبینار آنلاین'}</span>
          </span>
        </div>

        {/* Date banner */}
        <div className="absolute bottom-2.5 start-2.5 bg-ink-950/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-sans">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{formatPersianDate(event.startsAt, 'D MMMM YYYY')}</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <Link to={`/gathering/${event.slug}`}>
            <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-pink-600 transition-colors leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Location */}
          {event.location && (
            <p className="text-xs text-ink-600 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </p>
          )}

          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            {event.summary}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
          {isPast ? (
            <Link
              to={`/gathering/${event.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-ink-600 hover:text-ink-900"
            >
              <FileText className="w-3.5 h-3.5 text-ink-400" />
              <span>مشاهده گزارش و دستاوردها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to={`/gathering/${event.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700"
            >
              <span>اطلاعات و ثبت‌نام در رویداد</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
