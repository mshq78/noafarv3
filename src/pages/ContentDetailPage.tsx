import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Event,
  EventRegistration,
} from '../types';
import { SECTIONS } from '../config/sections';
import { getContentDetail, getRelatedContent, registerForEvent, getMyEventRegistrations } from '../services/endpoints';
import { CoursePlayer } from '../components/course/CoursePlayer';
import { ContentActions } from '../components/content/ContentActions';
import { CommentSection } from '../components/content/CommentSection';
import { RelatedContent } from '../components/content/RelatedContent';
import { AttachmentsList } from '../components/content/AttachmentsList';
import { Chip, Button, Skeleton } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatPersianDate } from '../utils/date';
import { toFaDigits } from '../utils/format';

export const ContentDetailPage: React.FC = () => {
  const { sectionSlug, slug } = useParams<{ sectionSlug: string; slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const validSection = (sectionSlug as SectionSlug) || 'academy';
  const currentSection = SECTIONS[validSection];

  const [content, setContent] = useState<ContentBase | null>(null);
  const [related, setRelated] = useState<ContentBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRegistration, setMyRegistration] = useState<EventRegistration | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!sectionSlug || !slug) return;

    let isMounted = true;
    setIsLoading(true);

    getContentDetail(validSection, slug)
      .then((data) => {
        if (isMounted) {
          setContent(data);
          // Fetch related
          getRelatedContent(data.sectionSlug, data.slug).then((rel) => {
            if (isMounted) setRelated(rel);
          });

          // If this is an event, check if already registered
          if (data.sectionSlug === 'gathering') {
            getMyEventRegistrations().then((regs) => {
              const reg = regs.find((r) => r.eventId === data.id && r.status === 'confirmed');
              if (isMounted && reg) setMyRegistration(reg);
            });
          }
        }
      })
      .catch(() => {
        if (isMounted) navigate(`/${validSection}`);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [validSection, slug, navigate, sectionSlug]);

  const handleEventRegister = async () => {
    if (!content) return;
    setIsRegistering(true);
    try {
      const reg = await registerForEvent(content.id);
      setMyRegistration(reg);
      showToast(`ثبت‌نام شما با موفقیت تایید شد! کد بلیط: ${reg.ticketCode}`, 'success');
    } catch {
      showToast('خطا در ثبت‌نام رویداد. لطفاً دوباره تلاش کنید.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

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
        <nav className="flex items-center gap-2 text-xs text-ink-500 font-medium overflow-x-auto">
          <Link to="/" className="hover:text-ink-900 transition-colors">
            خانه
          </Link>
          <span>/</span>
          <Link
            to={`/${content.sectionSlug}`}
            className="hover:text-ink-900 transition-colors"
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
              <span className="flex items-center gap-1 text-ink-700">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  نویسنده / ارائه‌دهنده:{' '}
                  {typeof content.author === 'string'
                    ? content.author
                    : content.author.displayName || 'نوآفر'}
                </span>
              </span>
            )}
            {(content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor && (
              <span className="flex items-center gap-1 text-ink-700">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  مدرس:{' '}
                  {(content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor?.name ||
                    (content as unknown as { instructor?: { name?: string; displayName?: string } }).instructor?.displayName}
                </span>
              </span>
            )}
            {(content as unknown as { submittedBy?: { displayName?: string } | string }).submittedBy && (
              <span className="flex items-center gap-1 text-ink-700">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>
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
        {content.sectionSlug === 'toolbox' && (
          <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50/40 p-6 rounded-2xl border-2 border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-start">
              <span className="text-xs font-bold text-pink-700">
                میز کار تعاملی بوم آنلاین
              </span>
              <h3 className="text-base font-black text-ink-900">
                این ابزار را به صورت آنلاین تکمیل، ذخیره و خروجی بگیرید
              </h3>
              <p className="text-xs text-ink-500">
                با تکمیل هر بوم در حساب کاربری خود، +۳۰ امتیاز نوآفری کسب نمایید.
              </p>
            </div>
            <Link to={`/toolbox/${content.slug}/canvas`}>
              <Button
                variant="accent"
                size="lg"
                rightIcon={<Layout className="w-4 h-4" />}
                className="shadow-md shrink-0"
              >
                ورود به بوم تعاملی
              </Button>
            </Link>
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
            <img
              src={content.heroImage?.url || (content as unknown as { coverImage?: { url?: string } }).coverImage?.url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Detailed Body Narrative (Markdown / Paragraphs) */}
        {content.body && (
          <div className="prose prose-ink max-w-none text-ink-800 text-sm sm:text-base leading-loose space-y-4 pt-4">
            <div className="whitespace-pre-line leading-relaxed">
              {content.body}
            </div>
          </div>
        )}

        {/* Attachments & Worksheets */}
        {content.attachments && content.attachments.length > 0 && (
          <AttachmentsList attachments={content.attachments} />
        )}

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
    </div>
  );
};
