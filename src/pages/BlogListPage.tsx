import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { getBlogPosts } from '../services/endpoints';
import { BlogPostCard } from '../components/cards/BlogPostCard';
import { Skeleton, EmptyState } from '../components/ui';
import { DotPattern } from '../components/brand/DotPattern';

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBlogPosts()
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-10 border border-ink-200 shadow-2xs overflow-hidden">
          <DotPattern
            width={180}
            height={180}
            rows={5}
            cols={5}
            dotColor="#0077b6"
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
        ) : posts.length === 0 ? (
          <EmptyState title="هنوز مقاله‌ای منتشر نشده است" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
