import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Layout,
  ExternalLink,
  CheckCircle2,
  Ticket,
} from 'lucide-react';
import {
  SectionSlug,
  ContentBase,
  Course,
  Experience,
  Tool,
  Event,
  EventRegistration,
} from '../types';
import { SECTIONS } from '../config/sections';
import { getContentDetail, getRelatedContent, registerForEvent, getMyEventRegistrations } from '../services/endpoints';
import { CoursePlayer } from '../components/course/CoursePlayer';
import { ContentActions } from '../components/content/ContentActions';
import { CommentSection } from '../components/content/CommentSection';
import { RelatedContent } from '../components/content/RelatedContent';
import { AttachmentsList, collectDownloads } from '../components/content/AttachmentsList';
import { Chip, Button, Skeleton } from '../components/ui';
import { SmartImage } from '../components/ui/SmartImage';
import { NotFoundPage } from './NotFoundPage';
import { LoginPromptModal } from '../components/modals/LoginPromptModal';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { SafeHtml } from '../components/ui/SafeHtml';
import { useToast } from '../components/ui/Toast';
import { formatPersianDate } from '../utils/date';
import { toFaDigits } from '../utils/format';

const VALID_SECTIONS: SectionSlug[] = [
  'academy',
  'toolbox',
  'library',
  'journey',
  'gathering',
  'spark',
];

export const ContentDetailPage: React.FC = () => {
  const { sectionSlug, slug } = useParams<{ sectionSlug: string; slug: string }>();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  // An unknown section is a 404, not a silent fallback to the academy.
  const isKnownSection = VALID_SECTIONS.includes(sectionSlug as SectionSlug);
  const validSection = sectionSlug as SectionSlug;
  const currentSection = isKnownSection ? SECTIONS[validSection] : undefined;
  const [notFound, setNotFound] = useState(false);

  const [content, setContent] = useState<ContentBase | null>(null);
  usePageMeta(content?.title, content?.summary, content?.heroImage?.url);
  const [related, setRelated] = useState<ContentBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRegistration, setMyRegistration] = useState<EventRegistration | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!sectionSlug || !slug) return;
    if (!isKnownSection) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);

    getContentDetail(validSection, slug)
      .then((data) => {
        if (isMounted) {
          setContent(data);
          // Fetch related
          getRelatedContent(data.sectionSlug, data.slug)
            .then((rel) => {
              if (isMounted) setRelated(rel);
            })
            .catch(() => {});

        }
      })
      .catch(() => {
        if (isMounted) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [validSection, slug, sectionSlug, isKnownSection]);

  const handleEventRegister = async () => {
    if (!content) return;
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsRegistering(true);
    try {
      const reg = await registerForEvent(content.id);
      setMyRegistration(reg);
      showToast(`ثبت‌نام شما با موفقیت تایید شد! کد بلیط: ${reg.ticketCode}`, 'success');
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'خطا در ثبت‌نام رویداد. لطفاً دوباره تلاش کنید.',
        'error',
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // Whether the visitor is already registered for this event. Only asked once
  // we know they are signed in: for a visitor it would be a guaranteed 401.
  useEffect(() => {
    if (!isAuthenticated || content?.sectionSlug !== 'gathering') return;
    let isMounted = true;
    getMyEventRegistrations()
      .then((regs) => {
        const reg = regs.find((r) => r.eventId === content.id && r.status === 'confirmed');
        if (isMounted && reg) setMyRegistration(reg);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, content?.id, content?.sectionSlug]);

  // A section that is "coming soon" is not linked anywhere; its sample items must
  // not be reachable by address either, or the site shows what it says it lacks.
  if (sectionSlug && SECTIONS[sectionSlug as keyof typeof SECTIONS]?.comingSoon) {
    return <Navigate to={`/${sectionSlug}`} replace />;
  }

  if (notFound) {
    return <NotFoundPage />;
  }

  if (isLoading || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-xs text-ink-500 font-medium overflow-x-auto py-2">
          <Link to="/" className="hover:text-ink-900 transition-colors py-1">
            خانه
          </Link>
          <span>/</span>
          <Link
            to={`/${content.sectionSlug}`}
            className="hover:text-ink-900 transition-colors py-1"
          >
            {currentSection?.nameFa || content.sectionSlug}
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-bold truncate">{content.title}</span>
        </nav>

        {/* Header: Title, Category & Meta */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link to={`/${content.sectionSlug}`}>
                <Chip size="sm" variant="primary">
                  {currentSection?.nameFa}
                </Chip>
              </Link>
              {content.category && (
                <Chip size="sm" variant="neutral">
                  {content.category.nameFa}
                </Chip>
              )}
            </div>

            <ContentActions content={content} />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-ink-900 leading-tight">
            {content.title}
          </h1>

          <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
            {content.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400 pt-2 border-t border-ink-100 font-sans">
            {content.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatPersianDate(content.publishedAt)}</span>
              </span>
            )}
            {content.author && (
              <span className="flex items-center gap-1 text-ink-700 min-w-0 max-w-full">
                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="min-w-0 break-words">
                  نویسنده / ارائه‌دهنده:{' '}
                  {typeof content.author === 'string'
                    ? content.author
                    : content.author.displayName || 'نوآفر'}
                </span>
              </span>
            )}
            {(content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor && (
              <span className="flex items-center gap-1 text-ink-700 min-w-0 max-w-full">
                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="min-w-0 break-words">
                  مدرس:{' '}
                  {(content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor?.name ||
                    (content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor?.displayName}
                </span>
              </span>
            )}
            {(content as unknown as { submittedBy?: { displayName?: string } | string }).submittedBy && (
              <span className="flex items-center gap-1 text-ink-700 min-w-0 max-w-full">
                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="min-w-0 break-words">
                  {content.sectionSlug === 'spark' ? 'ایده‌پرداز: ' : 'روایت‌کننده: '}
                  {typeof (content as unknown as { submittedBy?: { displayName?: string } | string }).submittedBy === 'string'
                    ? ((content as unknown as { submittedBy?: { displayName?: string } | string }).submittedBy as string)
                    : ((content as unknown as { submittedBy?: { displayName?: string } | string }).submittedBy as { displayName?: string })?.displayName || ''}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Specialized Section Layouts */}
        {/* 1. ACADEMY: Course Player & Syllabus */}
        {content.sectionSlug === 'academy' && (
          <CoursePlayer course={content as Course} />
        )}

        {/* 2. TOOLBOX: Canvas Interactive Launch Banner */}
        {content.sectionSlug === 'toolbox' && (content as Tool).supportsDigitalCanvas && (
          <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50/40 p-6 rounded-2xl border-2 border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-start">
              <span className="text-xs font-bold text-pink-700">
                میز کار تعاملی بوم آنلاین
              </span>
              <h2 className="text-base font-black text-ink-900">
                این ابزار را به صورت آنلاین تکمیل، ذخیره و خروجی بگیرید
              </h2>
              <p className="text-xs text-ink-500">
                با تکمیل هر بوم در حساب کاربری خود، +۳۰ امتیاز نوآفری کسب نمایید.
              </p>
            </div>
            <Button
              to={`/toolbox/${content.slug}/canvas`}
              variant="accent"
              size="lg"
              rightIcon={<Layout className="w-4 h-4" />}
              className="shadow-md shrink-0"
            >
              ورود به بوم تعاملی
            </Button>
          </div>
        )}

        {/* 3. JOURNEY: Key Impact Metric Callout */}
        {content.sectionSlug === 'journey' && (content as Experience).keyImpactMetric && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-ink-50 rounded-2xl border border-ink-200">
            <div className="space-y-1">
              <span className="text-xs text-ink-400 flex items-center gap-1 font-bold">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>سنجه کلیدی اثر اجتماعی</span>
              </span>
              <p className="text-sm font-black text-ink-900">
                {(content as Experience).keyImpactMetric}
              </p>
            </div>
            {(content as Experience).region && (
              <div className="space-y-1 sm:border-s sm:border-ink-200 sm:ps-4">
                <span className="text-xs text-ink-400 flex items-center gap-1 font-bold">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>منطقه و بستر اجرا</span>
                </span>
                <p className="text-sm font-bold text-ink-900">
                  {(content as Experience).region}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. GATHERING: Event Details Banner */}
        {content.sectionSlug === 'gathering' && (
          <div className="p-6 bg-pink-50/50 rounded-2xl border border-pink-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-ink-400 block font-bold">زمان برگزاری</span>
                <span className="text-sm font-black text-ink-900 font-sans">
                  {formatPersianDate((content as Event).startsAt)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-ink-400 block font-bold">محل / شیوه برگزاری</span>
                <span className="text-sm font-bold text-ink-900">
                  {(content as Event).location || 'آنلاین (در بستر اسکای‌روم)'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-ink-400 block font-bold">ظرفیت کارگاه</span>
                <span className="text-sm font-bold text-ink-900 font-sans">
                  {toFaDigits((content as Event).capacity || 50)} نفر
                </span>
              </div>
            </div>

            {myRegistration ? (
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">شما در این رویداد ثبت‌نام کرده‌اید.</span>
                    <span className="text-emerald-700">کد رهگیری و بلیط شما: <strong className="font-sans font-black">{myRegistration.ticketCode}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Ticket className="w-4 h-4" />
                  <span>ثبت‌شده در پروفایل شما</span>
                </div>
              </div>
            ) : ((content as Event).status === 'registering' || (content as Event).registrationStatus === 'registering') ? (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="accent"
                  size="md"
                  onClick={handleEventRegister}
                  isLoading={isRegistering}
                  rightIcon={<Ticket className="w-4 h-4" />}
                >
                  ثبت‌نام مستقیم در این کارگاه (+۳۰ امتیاز)
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Hero image for Library / Articles / General */}
        {content.sectionSlug !== 'academy' && (content.heroImage?.url || (content as unknown as { coverImage?: { url?: string } }).coverImage?.url) && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-ink-100 border border-ink-200">
            <SmartImage
              src={content.heroImage?.url || (content as unknown as { coverImage?: { url?: string } }).coverImage?.url}
              alt={content.title}
              className="w-full h-full object-cover"
              fallbackSrc="/mock/course-thumb.svg"
            />
          </div>
        )}

        {/* Detailed Body Narrative (Markdown / Paragraphs) */}
        {content.body && (
          <div className="rich-content text-ink-800 text-sm sm:text-base leading-loose space-y-4 pt-4">
            <SafeHtml className="leading-relaxed" html={content.body} />
          </div>
        )}

        {/* Attachments & Worksheets */}
        {(() => {
          const downloads = collectDownloads(content as Parameters<typeof collectDownloads>[0]);
          return downloads.length > 0 ? <AttachmentsList attachments={downloads} /> : null;
        })()}

        {/* Tags / Keywords */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs text-ink-400">کلیدواژه‌ها:</span>
            {content.tags.map((tag) => (
              <span
                key={typeof tag === 'string' ? tag : tag.id || tag.nameFa}
                className="text-xs bg-ink-100 text-ink-700 px-2.5 py-1 rounded-md"
              >
                #{typeof tag === 'string' ? tag : tag.nameFa}
              </span>
            ))}
          </div>
        )}

        {/* Related cross-section content */}
        <RelatedContent items={related} />

        {/* Comments & Discussion */}
        <CommentSection contentId={content.id} />
      </div>

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="ورود برای ثبت‌نام در رویداد"
        description="برای ثبت‌نام در کارگاه‌ها و دریافت بلیط، لطفاً وارد حساب کاربری خود شوید."
      />
    </div>
  );
};
