import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import { BlogPost } from '../../types';
import { formatPersianDate } from '../../utils/date';
import { formatMinutes } from '../../utils/format';

interface BlogPostCardProps {
  post: BlogPost;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  return (
    <div className="group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200">
      <Link to={`/blog/${post.slug}`} className="relative aspect-[16/9] bg-ink-100 overflow-hidden block">
        {post.heroImage && (
          <img
            src={post.heroImage.url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
        )}
        <div className="absolute bottom-2.5 end-2.5 bg-ink-950/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-sans">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatMinutes(post.readingMinutes)} مطالعه</span>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-400 font-sans">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatPersianDate(post.publishedAt)}</span>
          </div>

          <Link to={`/blog/${post.slug}`}>
            <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-sky-700 transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>

          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            {post.summary}
          </p>
        </div>

        <div className="pt-2 border-t border-ink-100 flex justify-end">
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800"
          >
            <span>ادامه مطلب</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
