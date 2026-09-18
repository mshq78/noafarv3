import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { SectionSlug, ContentBase, Category } from '../types';
import { SECTIONS } from '../config/sections';
import { getContentList, getCategories } from '../services/endpoints';
import { ContentCard } from '../components/cards';
import { SectionFilters } from '../components/layout/SectionFilters';
import { Button, Skeleton, EmptyState } from '../components/ui';
import { DotPattern } from '../components/brand/DotPattern';
import { TricolorRule } from '../components/brand/TricolorRule';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface SectionListPageProps {
  explicitSection?: SectionSlug;
}

export const SectionListPage: React.FC<SectionListPageProps> = ({ explicitSection }) => {
  const params = useParams<{ sectionSlug?: string }>();
  const currentSlug = (explicitSection || params.sectionSlug || 'academy') as SectionSlug;
  const sectionMeta = SECTIONS[currentSlug] || SECTIONS.academy;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraFilters, setExtraFilters] = useState<Record<string, string | undefined>>({});

  const [items, setItems] = useState<ContentBase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // The list refetches once typing settles rather than on every keystroke.
  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  // Load categories on section change
  useEffect(() => {
    let isMounted = true;
    setSelectedCategory(undefined);
    setSearchQuery('');
    setExtraFilters({});
    setPage(1);

    getCategories(currentSlug).then((cats) => {
      if (isMounted) setCategories(cats);
    });

    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  // Load content
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    setLoadError('');
    getContentList(currentSlug, {
      page,
      pageSize: 12,
      category: selectedCategory,
      q: debouncedSearch,
      ...extraFilters,
    })
      .then((res) => {
        if (!isMounted) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setTotalCount(res.total);
        setHasMore(res.hasMore);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError('بارگذاری فهرست محتوا ناموفق بود. لطفاً دوباره تلاش کنید.');
        if (page === 1) setItems([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlug, selectedCategory, debouncedSearch, extraFilters, page]);

  const handleExtraFilterChange = (key: string, value: string | undefined) => {
    setExtraFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearAll = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
    setExtraFilters({});
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header Banner */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-10 border border-ink-200 shadow-2xs overflow-hidden">
          {/* Tinted with the section's own accent colour. */}
          <DotPattern
            dotColor={sectionMeta.accentColorHex}
            className="opacity-30 end-0 -top-8"
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 font-sans">
                  {sectionMeta.slug}
                </span>
                {sectionMeta.taglineFa ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                    <span className="text-xs font-bold text-ink-600">
                      {sectionMeta.taglineFa}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-ink-900">
                {sectionMeta.nameFa}
              </h1>

              <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
                {sectionMeta.descriptionFa}
              </p>
            </div>

            {/* Conditional Action buttons for Spark and Journey */}
            {currentSlug === 'spark' && (
              <Link to="/spark/submit" className="shrink-0">
                <Button
                  size="lg"
                  variant="accent"
                  rightIcon={<PlusCircle className="w-4 h-4" />}
                >
                  ثبت ایده نو (+۵۰ امتیاز)
                </Button>
              </Link>
            )}

            {currentSlug === 'journey' && (
              <Link to="/journey/submit" className="shrink-0">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<PlusCircle className="w-4 h-4" />}
                >
                  ثبت روایت تجربه (+۱۰۰ امتیاز)
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-ink-100 max-w-xs">
            <TricolorRule height={2} />
          </div>
        </div>

        {/* Section Filters Component */}
        <SectionFilters
          section={currentSlug}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          extraFilters={extraFilters}
          onExtraFilterChange={handleExtraFilterChange}
          onClearAll={handleClearAll}
          totalCount={totalCount}
        />

        {loadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {loadError}
          </div>
        )}

        {/* Cards Grid */}
        {isLoading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-ink-200 space-y-3"
              >
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="موردی مطابق با فیلترهای انتخابی یافت نشد"
            description="می‌توانید عبارت جستجو را تغییر دهید یا فیلترهای اعمال‌شده را پاک کنید."
            action={
              <Button variant="secondary" onClick={handleClearAll}>
                پاک‌سازی همه فیلترها
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {items.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load More button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setPage((p) => p + 1)}
                  isLoading={isLoading}
                  rightIcon={<RefreshCw className="w-4 h-4" />}
                >
                  نمایش موارد بیشتر
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
