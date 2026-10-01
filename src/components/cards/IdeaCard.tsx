import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Heart, MessageSquare, User, ArrowLeft } from 'lucide-react';
import { Idea } from '../../types';
import { Chip } from '../ui';
import { toFaDigits } from '../../utils/format';

interface IdeaCardProps {
  idea: Idea;
  emphasis?: 'normal' | 'tall';
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, emphasis = 'normal' }) => {
  const isTall = emphasis === 'tall';

  return (
    <div className={`group tile-desaturate break-inside-avoid mb-5 flex flex-col bg-white rounded-xl border border-ink-200 ${isTall ? 'p-6 sm:p-7' : 'p-5'} shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 justify-between`}>
      <div className="space-y-3">
        {/* Header: Field badge + Lightbulb */}
        <div className="flex items-center justify-between">
          {idea.field ? (
            <Chip size="sm" variant="amber" className="font-semibold">
              {idea.field.nameFa}
            </Chip>
          ) : (
            <div />
          )}
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
            <Lightbulb className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <Link to={`/spark/${idea.slug}`}>
          <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-amber-700 transition-colors leading-snug">
            {idea.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-xs text-ink-600 line-clamp-3 leading-relaxed">
          {idea.summary}
        </p>

        {/* Submitter */}
        {idea.submittedBy && (
          <p className="text-xs text-ink-400 flex items-center gap-1.5 pt-1">
            <User className="w-3.5 h-3.5 text-ink-300" />
            <span>
              ایده‌پرداز:{' '}
              {typeof idea.submittedBy === 'string'
                ? idea.submittedBy
                : idea.submittedBy.displayName || 'کنشگر نوآفر'}
            </span>
          </p>
        )}
      </div>

      {/* Footer: Likes, Comments, Read More */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-ink-100 text-xs text-ink-500 font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-pink-500" />
            <span>{toFaDigits(idea.likeCount)}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            <span>{toFaDigits(idea.commentCount)}</span>
          </span>
        </div>

        <Link
          to={`/spark/${idea.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
        >
          <span>جزئیات ایده</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
