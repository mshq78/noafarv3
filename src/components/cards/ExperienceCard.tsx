import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, TrendingUp } from 'lucide-react';
import { Experience } from '../../types';
import { Chip } from '../ui';

interface ExperienceCardProps {
  experience: Experience;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience }) => {
  return (
    <div className="group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200">
      {/* Cover Image & Region Badge */}
      <Link
        to={`/journey/${experience.slug}`}
        className="relative aspect-video bg-ink-100 overflow-hidden block"
      >
        <img
          src={experience.heroImage?.url || '/mock/journey-cover.svg'}
          alt={experience.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 flex-wrap">
          {experience.region && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white/95 backdrop-blur-xs text-sky-800 shadow-2xs">
              <MapPin className="w-3 h-3 text-sky-600" />
              <span>{experience.region}</span>
            </span>
          )}
        </div>
        {experience.field && (
          <div className="absolute bottom-2.5 start-2.5">
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
