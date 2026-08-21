import React from 'react';
import { Sparkles } from 'lucide-react';
import { ContentBase } from '../../types';
import { ContentCard } from '../cards';

interface RelatedContentProps {
  items: ContentBase[];
  title?: string;
}

export const RelatedContent: React.FC<RelatedContentProps> = ({
  items,
  title = 'محتواهای مرتبط در بخش‌های دیگر نوآفر',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4 pt-10 border-t border-ink-200">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
