import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { SECTION_LIST } from '../../config/sections';
import { getContentList } from '../../services/endpoints';
import { ContentCard } from '../cards';
import { Skeleton, Tabs } from '../ui';
import { ContentBase, SectionSlug } from '../../types';

const PER_SECTION = 8;
const ALL = 'all';

// Sections that are still "coming soon" have no content to show.
const OPEN_SECTIONS = SECTION_LIST.filter((s) => !s.comingSoon);

/** Round-robin merge so the "all" tab mixes sections instead of grouping them. */
function interleave(lists: ContentBase[][]): ContentBase[] {
  const out: ContentBase[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
}

export const LatestCarousel: React.FC = () => {
  const [active, setActive] = useState<string>(ALL);
  const [bySection, setBySection] = useState<Partial<Record<SectionSlug, ContentBase[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(
      OPEN_SECTIONS.map((s) =>
        getContentList(s.slug, { page: 1, pageSize: PER_SECTION })
          .then((res) => [s.slug, res.items] as const)
          .catch(() => [s.slug, [] as ContentBase[]] as const),
      ),
    ).then((entries) => {
      if (!alive) return;
      setBySection(Object.fromEntries(entries));
      setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(
    () =>
      active === ALL
        ? interleave(OPEN_SECTIONS.map((s) => bySection[s.slug] ?? []))
        : bySection[active as SectionSlug] ?? [],
    [active, bySection],
  );

  // Start from the first card whenever the category changes.
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
  }, [active]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // "Next" follows the reading direction: leftwards in RTL, rightwards in LTR.
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const tabs = [
    { id: ALL, label: 'همه' },
    ...OPEN_SECTIONS.map((s) => ({ id: s.slug as string, label: s.nameFa })),
  ];
  const activeSection = OPEN_SECTIONS.find((s) => s.slug === active);

  return (
    <section id="latest-content" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block text-xs font-bold text-pink-700 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              تازه‌ها
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink-900">
              آخرین محتواهای نوآفر
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="قبلی"
              className="w-10 h-10 rounded-full border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="بعدی"
              className="w-10 h-10 rounded-full border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={active} onChange={setActive} variant="pills" />

        {isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 space-y-3 p-4 rounded-xl border border-ink-200">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-ink-500 py-10">هنوز محتوایی منتشر نشده است.</p>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 custom-scrollbar items-start"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="w-[78%] sm:w-72 lg:w-80 shrink-0 snap-start"
              >
                <ContentCard item={item} />
              </div>
            ))}
            {activeSection && (
              <Link
                to={`/${activeSection.slug}`}
                className="w-48 shrink-0 snap-start self-stretch flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 text-sm font-bold text-ink-700 hover:bg-ink-50"
              >
                مشاهده همه
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
