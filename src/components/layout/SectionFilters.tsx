import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Filter, ChevronLeft, ChevronRight, LayoutGrid, Rows3 } from 'lucide-react';
import { SectionSlug, Category } from '../../types';
import { Chip, Select } from '../ui';
import { toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';
import {
  TOOLBOX_FORMATS,
  LIBRARY_KINDS,
  GATHERING_KINDS,
  GATHERING_STATUSES,
  DIFFICULTY_LABELS,
} from '../../config/categories';

interface SectionFiltersProps {
  section: SectionSlug;
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (catSlug: string | undefined) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  // Extra filters
  extraFilters?: {
    stage?: string;
    format?: string;
    difficulty?: string;
    kind?: string;
    status?: string;
    [key: string]: string | undefined;
  };
  onExtraFilterChange?: (key: string, value: string | undefined) => void;
  onClearAll?: () => void;
  totalCount?: number;
}

export const SectionFilters: React.FC<SectionFiltersProps> = ({
  section,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  extraFilters = {} as NonNullable<SectionFiltersProps['extraFilters']>,
  onExtraFilterChange,
  onClearAll,
  totalCount,
}) => {
  const hasActiveFilters =
    !!selectedCategory ||
    !!searchQuery ||
    Object.values(extraFilters).some((v) => !!v);

  const [isWrapView, setIsWrapView] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    // In RTL, scrollLeft can be negative or positive depending on browser implementation
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const currentScroll = Math.abs(el.scrollLeft);
    // RTL: scrolling left moves away from initial position (scroll > 0)
    setCanScrollRight(currentScroll > 5);
    setCanScrollLeft(currentScroll < maxScroll - 5);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      updateScrollButtons();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories, updateScrollButtons, isWrapView]);

  // Horizontal Wheel Support
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isWrapView) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      // In RTL, deltaY scrolling down pushes content to the left
      el.scrollBy({
        left: -e.deltaY * 1.5,
        behavior: 'auto',
      });
    }
  };

  // Button Scroll Handlers
  const handleScrollStep = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // In RTL layout, scrolling to see next items (leftwards) requires negative left delta
    const delta = direction === 'left' ? -220 : 220;
    el.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  };

  // Mouse Drag to Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isWrapView) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="space-y-4 mb-8 bg-white p-4 sm:p-5 rounded-xl border border-ink-200 shadow-2xs">
      {/* Top row: Search input + Results count + Clear filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو در عنوان، کلیدواژه‌ها یا توضیحات..."
            className="w-full h-10 ps-10 pe-9 bg-ink-50 border border-ink-200 rounded-lg text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 cursor-pointer"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs text-ink-500">
          {totalCount !== undefined && (
            <span className="font-sans font-medium">
              نمایش <strong className="text-ink-900">{toFaDigits(totalCount)}</strong> مورد
            </span>
          )}
          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-bold hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>پاک‌سازی فیلترها</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories / Taxonomies Row with Smooth Horizontal Controls */}
      {categories.length > 0 && (
        <div className="relative group pt-1">
          <div className="flex items-center gap-2">
            {/* Scroll Container with left/right buttons and optional wrap mode */}
            <div className="relative flex-1 overflow-hidden">
              {/* Right Arrow (Scroll back towards start in RTL) */}
              {!isWrapView && canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScrollStep('right')}
                  className="absolute end-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 hover:bg-white text-ink-700 hover:text-sky-700 rounded-full shadow-md border border-ink-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                  title="دسته‌های قبلی"
                  aria-label="دسته‌های قبلی"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Scrollable Categories Track */}
              <div
                ref={scrollContainerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className={cn(
                  'transition-all duration-200 select-none',
                  isWrapView
                    ? 'flex flex-wrap gap-1.5 py-1'
                    : 'flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-0.5 custom-scrollbar cursor-grab active:cursor-grabbing scroll-smooth'
                )}
              >
                <Chip
                  size="sm"
                  selected={!selectedCategory}
                  onClick={() => {
                    if (!hasMovedRef.current) {
                      onSelectCategory(undefined);
                    }
                  }}
                  className="shrink-0"
                >
                  همه دسته‌ها
                </Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    size="sm"
                    selected={selectedCategory === cat.slug}
                    onClick={() => {
                      if (!hasMovedRef.current) {
                        onSelectCategory(
                          selectedCategory === cat.slug ? undefined : cat.slug
                        );
                      }
                    }}
                    className="shrink-0"
                  >
                    {cat.nameFa}
                  </Chip>
                ))}
              </div>

              {/* Left Arrow (Scroll forward towards remaining categories in RTL) */}
              {!isWrapView && canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScrollStep('left')}
                  className="absolute start-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 hover:bg-white text-ink-700 hover:text-sky-700 rounded-full shadow-md border border-ink-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                  title="مشاهده سایر دسته‌ها"
                  aria-label="مشاهده سایر دسته‌ها"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Toggle Multi-line Grid / Single-line Strip */}
            <button
              type="button"
              onClick={() => setIsWrapView(!isWrapView)}
              className={cn(
                'shrink-0 h-7 px-2 text-[11px] font-bold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer',
                isWrapView
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : 'bg-ink-50 text-ink-600 border-ink-200 hover:bg-ink-100 hover:text-ink-900'
              )}
              title={isWrapView ? 'حالت نواری (افقی)' : 'نمایش همه دسته‌ها (شبکه‌ای)'}
            >
              {isWrapView ? (
                <>
                  <Rows3 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">حالت نواری</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">نمایش همه</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Section Specific Filter Dropdowns */}
      {onExtraFilterChange && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-ink-100">
          {section === 'toolbox' && (
            <>
              <div className="w-40">
                <Select
                  value={extraFilters.format || ''}
                  onChange={(e) => onExtraFilterChange('format', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه قالب‌ها' },
                    ...TOOLBOX_FORMATS.map((f) => ({ value: f.id, label: f.nameFa })),
                  ]}
                />
              </div>
              <div className="w-36">
                <Select
                  value={extraFilters.difficulty || ''}
                  onChange={(e) => onExtraFilterChange('difficulty', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه سطوح' },
                    ...(Object.entries(DIFFICULTY_LABELS) as [keyof typeof DIFFICULTY_LABELS, { label: string }][]).map(
                      ([key, val]) => ({
                        value: key,
                        label: val.label,
                      })
                    ),
                  ]}
                />
              </div>
            </>
          )}

          {section === 'library' && (
            <div className="w-40">
              <Select
                value={extraFilters.kind || ''}
                onChange={(e) => onExtraFilterChange('kind', e.target.value || undefined)}
                options={[
                  { value: '', label: 'همه انواع' },
                  ...LIBRARY_KINDS.map((k) => ({ value: k.id, label: k.nameFa })),
                ]}
              />
            </div>
          )}

          {section === 'gathering' && (
            <>
              <div className="w-40">
                <Select
                  value={extraFilters.kind || ''}
                  onChange={(e) => onExtraFilterChange('kind', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه رویدادها' },
                    ...GATHERING_KINDS.map((k) => ({ value: k.id, label: k.nameFa })),
                  ]}
                />
              </div>
              <div className="w-40">
                <Select
                  value={extraFilters.status || ''}
                  onChange={(e) => onExtraFilterChange('status', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه وضعیت‌ها' },
                    ...GATHERING_STATUSES.map((s) => ({ value: s.id, label: s.nameFa })),
                  ]}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
