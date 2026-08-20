import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { SectionSlug, Category } from '../../types';
import { Chip, Select } from '../ui';
import { toFaDigits } from '../../utils/format';

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
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700"
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

      {/* Categories / Taxonomies Row */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Chip
            size="sm"
            selected={!selectedCategory}
            onClick={() => onSelectCategory(undefined)}
          >
            همه دسته‌ها
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              selected={selectedCategory === cat.slug}
              onClick={() =>
                onSelectCategory(selectedCategory === cat.slug ? undefined : cat.slug)
              }
            >
              {cat.nameFa}
            </Chip>
          ))}
        </div>
      )}

      {/* Section Specific Filter Dropdowns */}
      {onExtraFilterChange && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-ink-100">
          {section === 'toolbox' && (
            <>
              <div className="w-40">
                <Select
                  value={extraFilters.stage || ''}
                  onChange={(e) => onExtraFilterChange('stage', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه مراحل' },
                    { value: 'discover', label: 'مرحله ۱: کشف' },
                    { value: 'define', label: 'مرحله ۲: تعریف' },
                    { value: 'develop', label: 'مرحله ۳: توسعه' },
                    { value: 'deliver', label: 'مرحله ۴: تحویل' },
                  ]}
                />
              </div>
              <div className="w-36">
                <Select
                  value={extraFilters.format || ''}
                  onChange={(e) => onExtraFilterChange('format', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه قالب‌ها' },
                    { value: 'canvas', label: 'بوم تعاملی' },
                    { value: 'worksheet', label: 'کاربرگ' },
                    { value: 'guide', label: 'راهنما' },
                  ]}
                />
              </div>
              <div className="w-36">
                <Select
                  value={extraFilters.difficulty || ''}
                  onChange={(e) => onExtraFilterChange('difficulty', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه سطوح' },
                    { value: 'beginner', label: 'مقدماتی' },
                    { value: 'intermediate', label: 'متوسط' },
                    { value: 'advanced', label: 'پیشرفته' },
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
                  { value: '', label: 'همه قالب‌ها' },
                  { value: 'book', label: 'کتاب' },
                  { value: 'article', label: 'مقاله' },
                  { value: 'podcast', label: 'پادکست' },
                  { value: 'video', label: 'فیلم مستند' },
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
                    { value: 'workshop', label: 'کارگاه حضوری' },
                    { value: 'webinar', label: 'وبینار آنلاین' },
                  ]}
                />
              </div>
              <div className="w-40">
                <Select
                  value={extraFilters.status || ''}
                  onChange={(e) => onExtraFilterChange('status', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'همه وضعیت‌ها' },
                    { value: 'registering', label: 'در حال ثبت‌نام' },
                    { value: 'past', label: 'برگزار شده' },
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
