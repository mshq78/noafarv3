import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { BlogPost } from '../types';
import { getBlogPosts } from '../services/endpoints';
import { BlogPostCard } from '../components/cards/BlogPostCard';
import { Skeleton, EmptyState } from '../components/ui';
import { DotPattern } from '../components/brand/DotPattern';

export const BlogListPage: React.FC = () => {
  usePageMeta('بلاگ نوآفر');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setIsLoading(true);
    setFailed(false);
    getBlogPosts()
      .then((items) => live && setPosts(items))
      .catch(() => live && setFailed(true))
      .finally(() => live && setIsLoading(false));
    return () => {
      live = false;
    };
  }, [attempt]);

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-10 border border-ink-200 shadow-2xs overflow-hidden">
          <DotPattern
            color="#0077b6"
            className="opacity-30 end-0 -top-8"
          />

          <div className="space-y-2 relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              یادداشت‌ها و مقالات تحلیلی
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-ink-900">
              بلاگ و دیدگاه‌های نوآفر
            </h1>
            <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
              تحلیل رویدادها، نقد کتاب‌های روز دنیا، مصاحبه با کارآفرینان اجتماعی و بررسی سیاست‌گذاری‌های حوزه زیست‌بوم نوآوری اجتماعی.
            </p>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : failed ? (
          <div role="alert" className="bg-white border border-ink-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-ink-700">بارگذاری مقالات انجام نشد. اتصال خود را بررسی کنید و دوباره تلاش کنید.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
            >
              تلاش دوباره
            </button>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState title="هنوز مقاله‌ای منتشر نشده است" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
