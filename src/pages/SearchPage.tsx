import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { ContentBase, SectionSlug } from '../types';
import { searchAll } from '../services/endpoints';
import { SECTION_LIST } from '../config/sections';
import { ContentCard } from '../components/cards';
import { Tabs, Skeleton, EmptyState } from '../components/ui';
import { toFaDigits } from '../utils/format';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSection = (searchParams.get('section') || 'all') as SectionSlug | 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<string>(initialSection);
  const [results, setResults] = useState<ContentBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // One request once typing settles, instead of one per keystroke.
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    let isMounted = true;
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchAll(trimmed, activeTab === 'all' ? undefined : (activeTab as SectionSlug))
      .then((data) => {
        if (isMounted) setResults(data);
      })
      .catch(() => {
        if (isMounted) setResults([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeTab]);

  // The address bar follows the debounced value so typing does not push a
  // history entry per character.
  useEffect(() => {
    setSearchParams(
      debouncedQuery ? { q: debouncedQuery, section: activeTab } : {},
      { replace: true },
    );
  }, [debouncedQuery, activeTab, setSearchParams]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'all', label: 'همه درگاه‌ها' },
    ...SECTION_LIST.map((s) => ({ id: s.slug, label: s.nameFa })),
  ];

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Search Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-ink-200 shadow-2xs space-y-4">
          <h1 className="text-xl font-black text-ink-900">
            جستجوی یکپارچه در نوآفر
          </h1>

          <div className="relative">
            <Search className="w-5 h-5 absolute start-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="جستجو در دوره‌ها، بوم‌ها، کتب، تجارب، رویدادها و ایده‌ها..."
              className="w-full h-12 ps-12 pe-10 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-2 overflow-x-auto">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
              variant="pills"
            />
          </div>
        </div>

        {/* Search Results Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : !query.trim() ? (
          <div className="text-center py-16 text-ink-500 text-sm">
            عبارت مورد نظر خود را برای جستجو در میان تمام منابع پلتفرم وارد فرمایید.
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="نتیجه‌ای یافت نشد"
            description={`هیچ نتیجه‌ای برای عبارت «${query}» یافت نشد. لطفاً کلیدواژه‌های دیگری را امتحان کنید.`}
          />
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-ink-500 font-sans">
              یافتن <strong className="text-ink-900">{toFaDigits(results.length)}</strong> نتیجه برای «{query}»
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {results.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
