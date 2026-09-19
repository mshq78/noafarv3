import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, TrendingUp, Calendar } from 'lucide-react';
import { Experience } from '../../types';
import { Chip } from '../ui';
import { SmartImage } from '../ui/SmartImage';
import { toFaDigits } from '../../utils/format';

interface ExperienceCardProps {
  experience: Experience;
  emphasis?: 'normal' | 'tall';
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience, emphasis = 'normal' }) => {
  const isTall = emphasis === 'tall';

  return (
    <div className="group tile-desaturate break-inside-avoid mb-5 flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200">
      {/* Cover Image & Region Badge */}
      <Link
        to={`/journey/${experience.slug}`}
        className={`relative ${isTall ? 'aspect-[4/5]' : 'aspect-video'} bg-ink-100 overflow-hidden block`}
      >
        <SmartImage
          src={experience.heroImage?.url || '/mock/journey-cover.svg'}
          alt={experience.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
          fallbackSrc="/mock/journey-cover.svg"
        />

        {/* Hover / Focus Summary Overlay */}
        {experience.summary && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 via-ink-950/70 to-transparent pt-10 px-4 pb-4 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
            <span className="text-[11px] font-bold text-sky-300 mb-1">درباره این تجربه:</span>
            <p className="text-xs leading-relaxed line-clamp-3 text-ink-100">
              {experience.summary}
            </p>
          </div>
        )}

        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 flex-wrap z-20">
          {experience.region && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white/95 backdrop-blur-xs text-sky-800 shadow-2xs">
              <MapPin className="w-3 h-3 text-sky-600" />
              <span>{experience.region}</span>
            </span>
          )}
        </div>
        {experience.field && (
          <div className="absolute bottom-2.5 start-2.5 z-20">
            <Chip size="sm" variant="sky" className="bg-white/95 backdrop-blur-xs font-semibold">
              {experience.field.nameFa}
            </Chip>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <Link to={`/journey/${experience.slug}`}>
            <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-sky-700 transition-colors leading-snug">
              {experience.title}
            </h3>
          </Link>

          {experience.organization && (
            <p className="text-xs text-ink-600 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{experience.organization}</span>
            </p>
          )}

          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            {experience.summary}
          </p>
        </div>

        {/* Footer Meta: Solar Year & Field */}
        <div className="flex items-center justify-between pt-2.5 border-t border-ink-100 text-xs text-ink-500 font-sans">
          {experience.field && (
            <span className="text-sky-700 font-medium truncate">
              {experience.field.nameFa}
            </span>
          )}
          {experience.year && (
            <span className="flex items-center gap-1 shrink-0 text-ink-400 ms-auto">
              <Calendar className="w-3.5 h-3.5 text-ink-400" />
              <span>سال {toFaDigits(experience.year)}</span>
            </span>
          )}
        </div>

        {/* Highlighted Impact Metric */}
        {experience.keyImpactMetric && (
          <div className="pt-2.5 border-t border-ink-100 flex items-center gap-2 bg-amber-50/70 -mx-4 -mb-4 p-3 border-t border-amber-100">
            <div className="p-1 bg-amber-100 text-amber-800 rounded-md shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-amber-900 line-clamp-1">
              {experience.keyImpactMetric}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
