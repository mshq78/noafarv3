import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';
import { SafeHtml } from '../components/ui/SafeHtml';
import { SmartImage } from '../components/ui/SmartImage';
import { getBlogPostDetail } from '../services/endpoints';
import { CommentSection } from '../components/content/CommentSection';
import { ContentActions } from '../components/content/ContentActions';
import { Skeleton } from '../components/ui';
import { formatPersianDate } from '../utils/date';
import { formatMinutes } from '../utils/format';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getBlogPostDetail(slug)
      .then(setPost)
      .catch(() => navigate('/blog'))
      .finally(() => setIsLoading(false));
  }, [slug, navigate]);

  if (isLoading || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به بلاگ</span>
          </Link>

          <ContentActions content={post as any} />
        </div>

        {/* Title & Metadata */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-4xl font-black text-ink-900 leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-ink-600 leading-relaxed font-medium">
            {post.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400 font-sans pt-2 border-t border-ink-100">
            <span className="flex items-center gap-1 text-ink-700 font-bold">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {post.author
                  ? typeof post.author === 'string'
                    ? post.author
                    : post.author.displayName || 'تحریریه نوآفر'
                  : 'تحریریه نوآفر'}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatPersianDate(post.publishedAt)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatMinutes(post.readingMinutes)} مطالعه</span>
            </span>
          </div>
        </div>

        {/* Hero Image */}
        {post.heroImage?.url && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-ink-100 border border-ink-200">
            <SmartImage
              src={post.heroImage.url}
              alt={post.title}
              className="w-full h-full object-cover"
              fallbackSrc="/mock/blog-cover.svg"
            />
          </div>
        )}

        {/* Body Text */}
        <div className="rich-content text-sm sm:text-base text-ink-800 leading-loose space-y-4 pt-4">
          <SafeHtml className="leading-relaxed" html={post.body} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-ink-100">
            <span className="text-xs text-ink-400">برچسب‌ها:</span>
            {post.tags.map((t) => {
              const tagText = typeof t === 'string' ? t : t.nameFa;
              const tagKey = typeof t === 'string' ? t : t.id || t.nameFa;
              return (
                <span
                  key={tagKey}
                  className="text-xs bg-ink-100 text-ink-700 px-2.5 py-1 rounded-md"
                >
                  #{tagText}
                </span>
              );
            })}
          </div>
        )}

        {/* Comments */}
        <CommentSection contentId={post.id} />
      </article>
    </div>
  );
};
