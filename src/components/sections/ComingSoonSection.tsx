import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { SectionMeta } from '../../types';
import { DotPattern } from '../brand/DotPattern';
import { TricolorRule } from '../brand/TricolorRule';

interface ComingSoonSectionProps {
  section: SectionMeta;
}

/**
 * Stands in for a portal that is announced but not open yet. The card and the
 * nav item for such a portal are already inert, but the route stays reachable
 * by typing the URL — this is what that visitor sees instead of an empty list.
 */
export const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({ section }) => {
  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative bg-white rounded-2xl p-8 sm:p-12 border border-ink-200 shadow-2xs overflow-hidden text-center">
          <DotPattern dotColor={section.accentColorHex} className="opacity-30 end-0 -top-8" />

          <div className="relative z-10 space-y-5">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{
                color: section.accentColorHex,
                borderColor: section.accentColorHex,
                backgroundColor: `${section.accentColorHex}14`,
              }}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{section.taglineFa || 'به‌زودی'}</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-ink-900">{section.nameFa}</h1>

            <div className="w-24 mx-auto">
              <TricolorRule height={3} />
            </div>

            <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-xl mx-auto">
              {section.descriptionFa}
            </p>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800 transition-colors group"
              >
                <span>بازگشت به صفحهٔ اصلی</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
