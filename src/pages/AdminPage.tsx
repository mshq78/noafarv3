import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Inbox,
  MessageSquare,
  Mail,
  Calendar,
  Users,
  Database,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Award,
  ExternalLink,
  ChevronLeft,
  BookOpen,
  Wrench,
  Compass,
  Zap,
  GraduationCap,
  Shield,
  ShieldAlert,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SiteSettingsManager } from "../components/admin/SiteSettingsManager";
import { SafeHtml } from '../components/ui/SafeHtml';
import { htmlToPlainText } from '../utils/sanitize';
import {
  SectionSlug,
  ContentBase,
  Submission,
  Comment,
  ContactMessage,
  EventRegistration,
  User,
  Category,
} from '../types';
import {
  adminGetAllSubmissions,
  adminApproveSubmission,
  adminRequestRevisionSubmission,
  adminRejectSubmission,
  adminGetAllComments,
  adminApproveComment,
  adminDeleteComment,
  adminGetAllContactMessages,
  adminUpdateContactMessage,
  adminDeleteContactMessage,
  adminGetAllEventRegistrations,
  adminGetAllUsers,
  adminUpdateUserRole,
  adminAwardPoints,
  adminAddContent,
  adminUpdateContent,
  adminDeleteContent,
  adminGetContent,
  adminGetStats,
  type AdminStats,
  adminSetUserBlocked,
  getCategories,
} from '../services/endpoints';
import { ApiError } from '../services/api';
import { isOperatorRole } from '../services/auth';
import { Button, Input, Textarea, Chip, Modal, RichTextEditor, FileUpload } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { toFaDigits } from '../utils/format';
import { formatPersianDate } from '../utils/date';
import { cn } from '../utils/cn';

type AdminTab =
  | 'overview'
  | 'content'
  | 'submissions'
  | 'comments'
  | 'messages'
  | 'events'
  | 'users'
  | 'backup'
  | 'settings';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  // Authorisation is the server's answer, echoed here only to decide what to
  // render: every admin endpoint re-checks the caller's role independently.
  const isAdmin = isAuthenticated && isOperatorRole(user?.role);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<(Comment & { contentTitle?: string })[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allContent, setAllContent] = useState<ContentBase[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Modals & form states
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentBase | null>(null);
  const [contentFormSection, setContentFormSection] = useState<SectionSlug | 'blog'>('academy');
  const [contentFormData, setContentFormData] = useState<any>({
    title: '',
    slug: '',
    summary: '',
    body: '',
    categorySlug: '',
    tagsString: '',
    imageUrl: '',
    // specific fields
    duration: '',
    level: 'مقدماتی تا پیشرفته',
    author: 'تیم علمی نوآفر',
    organization: '',
    region: 'سراسری',
    keyImpactMetric: '',
    location: 'آنلاین',
    capacity: 50,
    readingMinutes: 5,
  });

  // Submission action modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [actionModalType, setActionModalType] = useState<'approve' | 'revision' | 'reject' | null>(null);
  const [operatorNote, setOperatorNote] = useState('');

  // User points modal
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<User | null>(null);
  const [pointsToAward, setPointsToAward] = useState(50);
  const [pointsReason, setPointsReason] = useState('پاداش مشارکت ویژه در نوآفر');

  // Content tab filter & search
  const [contentFilterSection, setContentFilterSection] = useState<string>('all');
  const [contentSearchQuery, setContentSearchQuery] = useState('');

  // Submissions tab filter
  const [subFilterStatus, setSubFilterStatus] = useState<string>('all');

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  /** Runs an admin action, reporting failures instead of silently swallowing them. */
  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      showToast(successMessage, 'success');
      triggerRefresh();
      return true;
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'انجام این عملیات ناموفق بود.',
        'error',
      );
      return false;
    }
  };

  // Load all admin data straight from the API.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    setLoadError('');
    Promise.all([
      adminGetAllSubmissions(),
      adminGetAllComments(),
      adminGetAllContactMessages(),
      adminGetAllEventRegistrations(),
      adminGetAllUsers(),
      adminGetContent(),
      adminGetStats(),
      getCategories(),
    ])
      .then(([subs, cmts, msgs, regs, users, content, statsResult, categories]) => {
        if (cancelled) return;
        setSubmissions(subs);
        setComments(cmts);
        setMessages(msgs);
        setRegistrations(regs);
        setUsersList(users);
        setAllContent(content);
        setStats(statsResult);
        setCategoriesList(categories);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError ? error.message : 'بارگذاری اطلاعات پنل مدیریت ناموفق بود.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, isAdmin]);

  // Statistics — server counts when available, local counts as a fallback.
  const pendingSubmissionsCount =
    stats?.pendingSubmissions ?? submissions.filter((s) => s.status === 'pending').length;
  const pendingCommentsCount =
    stats?.pendingComments ?? comments.filter((c) => c.status === 'pending').length;
  const unreadMessagesCount =
    stats?.unreadMessages ?? messages.filter((m) => m.status === 'unread').length;
  const totalContentCount = stats?.contentCount ?? allContent.length;

  // ----------------------------------------------------------------
  // CONTENT ACTIONS
  // ----------------------------------------------------------------
  const handleOpenCreateContent = () => {
    setEditingContent(null);
    setContentFormData({
      title: '',
      slug: `item-${Date.now().toString(36)}`,
      summary: '',
      body: '',
      categorySlug: categoriesList[0]?.slug || 'general',
      tagsString: 'نوآوری اجتماعی, توسعه محلی',
      imageUrl: '/mock/course-cover.svg',
      duration: '۴ ساعت',
      level: 'مقدماتی تا پیشرفته',
      author: 'دبیرخانه نوآفر',
      organization: 'مجموعه نوآفر',
      region: 'سراسری',
      keyImpactMetric: 'بهبود شاخص‌های پایداری و مشارکت',
      location: 'آنلاین (اسکای‌روم)',
      capacity: 50,
      readingMinutes: 6,
    });
    setIsContentModalOpen(true);
  };

  const handleOpenEditContent = (item: ContentBase) => {
    setEditingContent(item);
    setContentFormSection(item.sectionSlug as SectionSlug);
    setContentFormData({
      title: item.title,
      slug: item.slug,
      summary: item.summary || '',
      body: item.body || '',
      categorySlug: item.category?.slug || '',
      tagsString: (item.tags || []).map((t) => (typeof t === 'string' ? t : t.nameFa)).join(', '),
      imageUrl: item.heroImage?.url || (item as any).coverImage?.url || '',
      duration: (item as any).duration || '',
      level: (item as any).level || '',
      author: typeof item.author === 'string' ? item.author : item.author?.displayName || '',
      organization: (item as any).organization || '',
      region: (item as any).region || '',
      keyImpactMetric: (item as any).keyImpactMetric || '',
      location: (item as any).location || '',
      capacity: (item as any).capacity || 50,
      eventStatus: (item as any).status || 'registering',
      eventKind: (item as any).kind || 'workshop',
      startsAt: (item as any).startsAt || '',
      readingMinutes: (item as any).readingMinutes || 5,
    });
    setIsContentModalOpen(true);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentFormData.title?.trim()) {
      showToast('عنوان محتوا الزامی است.', 'error');
      return;
    }

    const tags = contentFormData.tagsString
      .split(/[,،]/)
      .map((t: string) => t.trim())
      .filter(Boolean);

    const categoryObj = categoriesList.find((c) => c.slug === contentFormData.categorySlug) || {
      id: `cat-${contentFormData.categorySlug || 'general'}`,
      slug: contentFormData.categorySlug || 'general',
      nameFa: 'عمومی و کاربردی',
    };

    const section = editingContent
      ? (editingContent.sectionSlug as SectionSlug | 'blog')
      : contentFormSection;

    // Only the fields that belong to this section are sent; the API drops
    // anything it does not recognise, and a course must not inherit an
    // event's registration status the way the old flat payload made it.
    const data: Record<string, unknown> = {};
    if (section === 'academy') {
      data.duration = contentFormData.duration;
      data.level = contentFormData.level;
    } else if (section === 'journey') {
      data.organization = contentFormData.organization;
      data.region = contentFormData.region;
      data.keyImpactMetric = contentFormData.keyImpactMetric;
      data.field = categoryObj;
    } else if (section === 'spark') {
      data.field = categoryObj;
    } else if (section === 'gathering') {
      data.location = contentFormData.location;
      data.capacity = Number(contentFormData.capacity) || 50;
      data.status = contentFormData.eventStatus || 'registering';
      data.kind = contentFormData.eventKind || 'workshop';
      if (contentFormData.startsAt) data.startsAt = contentFormData.startsAt;
    } else if (section === 'blog') {
      data.readingMinutes = Number(contentFormData.readingMinutes) || 5;
    } else if (section === 'library') {
      if (contentFormData.imageUrl) {
        data.coverImage = { id: 'cover-1', type: 'image', url: contentFormData.imageUrl };
      }
    }

    const payload: Record<string, unknown> = {
      title: contentFormData.title.trim(),
      slug: contentFormData.slug?.trim() || undefined,
      summary: contentFormData.summary,
      body: contentFormData.body,
      category: categoryObj,
      tags,
      author: contentFormData.author || undefined,
      heroImage: contentFormData.imageUrl
        ? { id: 'img-1', type: 'image', url: contentFormData.imageUrl }
        : undefined,
      data,
    };

    setIsSavingContent(true);
    try {
      if (editingContent) {
        await adminUpdateContent(editingContent.id, payload);
        showToast('محتوا با موفقیت بروزرسانی شد.', 'success');
      } else {
        await adminAddContent(section, payload);
        showToast('محتوای جدید با موفقیت ایجاد و منتشر شد.', 'success');
      }
      setIsContentModalOpen(false);
      triggerRefresh();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'ذخیره محتوا ناموفق بود.',
        'error',
      );
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleDeleteContent = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف محتوای «${title}» اطمینان دارید؟`)) return;
    await runAction(() => adminDeleteContent(id), 'محتوا با موفقیت حذف گردید.');
  };

  // ----------------------------------------------------------------
  // SUBMISSION ACTIONS
  // ----------------------------------------------------------------
  const handleApproveSubmission = async () => {
    if (!selectedSubmission) return;
    const ok = await runAction(
      () =>
        adminApproveSubmission(
          selectedSubmission.id,
          operatorNote || 'طرح شما تایید و در سایت منتشر شد.',
        ),
      'طرح تایید و به محتوای سایت اضافه شد.',
    );
    if (!ok) return;
    setSelectedSubmission(null);
    setActionModalType(null);
    setOperatorNote('');
  };

  const handleRequestRevision = async () => {
    if (!selectedSubmission) return;
    if (!operatorNote.trim()) {
      showToast('لطفاً پیام راهنمایی برای اصلاح طرح را بنویسید.', 'error');
      return;
    }
    const ok = await runAction(
      () => adminRequestRevisionSubmission(selectedSubmission.id, operatorNote),
      'پیام اصلاحیه برای کاربر ارسال شد.',
    );
    if (!ok) return;
    setSelectedSubmission(null);
    setActionModalType(null);
    setOperatorNote('');
  };

  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return;
    const ok = await runAction(
      () =>
        adminRejectSubmission(
          selectedSubmission.id,
          operatorNote || 'با معیارهای انتشار نوآفر همخوانی نداشت.',
        ),
      'وضعیت طرح به رد شده تغییر یافت.',
    );
    if (!ok) return;
    setSelectedSubmission(null);
    setActionModalType(null);
    setOperatorNote('');
  };

  // ----------------------------------------------------------------
  // COMMENTS ACTIONS
  // ----------------------------------------------------------------
  const handleApproveComment = (id: string) =>
    runAction(() => adminApproveComment(id), 'دیدگاه با موفقیت تایید و عمومی شد.');

  const handleDeleteComment = (id: string) => {
    if (!window.confirm('آیا از حذف این دیدگاه اطمینان دارید؟')) return;
    void runAction(() => adminDeleteComment(id), 'دیدگاه حذف شد.');
  };

  // ----------------------------------------------------------------
  // MESSAGES ACTIONS
  // ----------------------------------------------------------------
  const handleToggleMessageStatus = async (msg: ContactMessage) => {
    const nextStatus = msg.status === 'unread' ? 'read' : msg.status === 'read' ? 'replied' : 'read';
    await runAction(
      () => adminUpdateContactMessage(msg.id, nextStatus),
      `وضعیت پیام به «${nextStatus === 'replied' ? 'پاسخ‌داده‌شده' : 'بررسی‌شده'}» تغییر یافت.`,
    );
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('آیا از حذف این پیام اطمینان دارید؟')) return;
    await runAction(() => adminDeleteContactMessage(id), 'پیام حذف شد.');
  };

  // ----------------------------------------------------------------
  // USER ACTIONS
  // ----------------------------------------------------------------
  const handleChangeUserRole = async (userId: string, currentRole: string) => {
    if (userId === user?.id) {
      showToast('تغییر نقش حساب خودتان ممکن نیست.', 'error');
      return;
    }
    // The server rejects any role outside this set, and only an admin may
    // call it at all — this is just the matching UI toggle.
    const nextRole: 'member' | 'admin' = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await adminUpdateUserRole(userId, nextRole);
      showToast(
        `نقش کاربر به «${nextRole === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}» تغییر یافت.`,
        'success',
      );
      triggerRefresh();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'تغییر نقش کاربر ناموفق بود.',
        'error',
      );
    }
  };

  const handleToggleUserBlocked = async (userId: string, isBlocked: boolean) => {
    if (userId === user?.id) {
      showToast('مسدود کردن حساب خودتان ممکن نیست.', 'error');
      return;
    }
    const next = !isBlocked;
    if (
      next &&
      !window.confirm('با مسدود کردن این حساب، همهٔ نشست‌های فعال آن بسته می‌شود. ادامه می‌دهید؟')
    ) {
      return;
    }
    try {
      await adminSetUserBlocked(userId, next);
      showToast(next ? 'حساب کاربر مسدود شد.' : 'مسدودیت حساب کاربر برداشته شد.', 'success');
      triggerRefresh();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'تغییر وضعیت حساب کاربر ناموفق بود.',
        'error',
      );
    }
  };

  const handleAwardPoints = async () => {
    if (!selectedUserForPoints) return;
    const amount = Number(pointsToAward);
    if (!Number.isFinite(amount) || amount === 0) {
      showToast('مقدار امتیاز معتبر نیست.', 'error');
      return;
    }
    const ok = await runAction(
      () => adminAwardPoints(selectedUserForPoints.id, Math.trunc(amount), pointsReason),
      `${toFaDigits(Math.abs(Math.trunc(amount)))} امتیاز برای «${selectedUserForPoints.displayName || 'کاربر'}» ثبت شد.`,
    );
    if (!ok) return;
    setSelectedUserForPoints(null);
    triggerRefresh();
  };

  // ----------------------------------------------------------------
  // BACKUP & EXPORT
  // ----------------------------------------------------------------
  /**
   * Exports the catalogue the admin can see as JSON. Restoring and resetting
   * are deliberately not offered from the browser: with the data now in
   * PostgreSQL those are database operations (`pg_dump` / `pg_restore`), and a
   * one-click "reset everything" button in a web panel is a foot-gun.
   */
  const handleExportDb = async () => {
    try {
      const [content, subs, cmts, msgs, regs, users] = await Promise.all([
        adminGetContent(),
        adminGetAllSubmissions(),
        adminGetAllComments(),
        adminGetAllContactMessages(),
        adminGetAllEventRegistrations(),
        adminGetAllUsers(),
      ]);

      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          content,
          submissions: subs,
          comments: cmts,
          contactMessages: msgs,
          eventRegistrations: regs,
          users,
        },
        null,
        2,
      );

      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `noafar-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      showToast('فایل خروجی اطلاعات با موفقیت دانلود شد.', 'success');
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'تهیه فایل خروجی ناموفق بود.',
        'error',
      );
    }
  };

  // Filtered contents
  const filteredContent = allContent.filter((item) => {
    if (contentFilterSection !== 'all' && item.sectionSlug !== contentFilterSection) return false;
    if (contentSearchQuery.trim()) {
      const q = contentSearchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.summary?.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (subFilterStatus !== 'all' && s.status !== subFilterStatus) return false;
    return true;
  });

  // Security Gate for Non-Admin Users
  if (isAuthLoading) {
    return (
      <div className="min-h-[85vh] bg-ink-50/60 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Shield className="w-4 h-4 text-ink-400 animate-pulse" />
          <span>در حال بررسی سطح دسترسی…</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] bg-ink-50/60 py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-ink-200 rounded-3xl p-8 shadow-xl space-y-6 text-center">
          {/* Security Alert Header */}
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-100/80 text-rose-800 text-[11px] font-bold rounded-full inline-block">
              کنترل دسترسی امنیتی (RBAC)
            </span>
            <h2 className="text-xl font-black text-ink-900">
              دسترسی محدود به مدیران ارشد
            </h2>
            <p className="text-xs text-ink-500 leading-relaxed max-w-sm mx-auto">
              این بخش شامل مدیریت پایگاه داده، تایید یا رد ارسال‌های نوآوران، داوری و کنترل کاربران است و تنها با مجوز مدیر ارشد سامانه در دسترس می‌باشد.
            </p>
          </div>

          {/* Current user info */}
          <div className="p-3 bg-ink-50 rounded-xl border border-ink-200/80 text-xs text-ink-600 flex items-center justify-between">
            <span>حساب کاربری فعلی:</span>
            <span className="font-bold text-ink-800">
              {user?.displayName || 'مهمان'} ({user?.role === 'member' ? 'کاربر عضو' : user?.role || 'نامشخص'})
            </span>
          </div>

          {/*
            There is no client-side password here on purpose. The panel opens
            only for an account the server has marked as operator or admin;
            a role is granted in the database (or via BOOTSTRAP_ADMIN_PHONES),
            never by anything typed into this page.
          */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 leading-relaxed text-start flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <span>
              دسترسی مدیریت بر اساس نقش حساب کاربری شما تعیین می‌شود. اگر باید به این بخش دسترسی
              داشته باشید، از مدیر ارشد سامانه بخواهید نقش حساب شما را ارتقا دهد و سپس دوباره وارد شوید.
            </span>
          </div>

          {!isAuthenticated && (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login?returnTo=/admin')}
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              ورود به حساب کاربری
            </Button>
          )}

          {/* Action Links */}
          <div className="pt-3 border-t border-ink-100 flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate('/')}
              className="w-full text-xs"
              leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              بازگشت به صفحه اصلی نوآفر
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="w-full text-xs text-ink-500"
            >
              مشاهده میز کار کاربری
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50/60 pb-16">
      {/* Admin Top Header Banner */}
      <div className="bg-white border-b border-ink-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-ink-900 flex items-center gap-2">
                  <span>پنل مدیریت و راهبری نوآفر</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-sans font-bold rounded-full">
                    نسخه زنده و ۱۰۰٪ فعال
                  </span>
                </h1>
                <p className="text-xs text-ink-500">
                  مدیریت محتوا، بررسی ارسال‌های کاربران، نظارت بر دیدگاه‌ها، رویدادها و دیتابیس
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateContent}
                rightIcon={<Plus className="w-4 h-4" />}
              >
                افزودن محتوای جدید
              </Button>
              <Link to="/">
                <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-4 h-4" />}>
                  مشاهده سایت
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 border-t border-ink-100 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'settings'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Settings className="w-4 h-4" />
              <span>تنظیمات سامانه</span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'overview'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>پیشخوان و آمار</span>
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'content'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>مدیریت محتوا</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-current rounded-md text-[10px] font-sans">
                {toFaDigits(totalContentCount)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'submissions'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Inbox className="w-4 h-4" />
              <span>درخواست‌ها و ارسال‌ها</span>
              {pendingSubmissionsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-sans">
                  {toFaDigits(pendingSubmissionsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'comments'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span>دیدگاه‌ها</span>
              {pendingCommentsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-pink-500 text-white rounded-full text-[10px] font-sans">
                  {toFaDigits(pendingCommentsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'messages'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Mail className="w-4 h-4" />
              <span>پیام‌های تماس</span>
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px] font-sans">
                  {toFaDigits(unreadMessagesCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'events'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>ثبت‌نام رویدادها</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-current rounded-md text-[10px] font-sans">
                {toFaDigits(registrations.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'users'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Users className="w-4 h-4" />
              <span>کاربران و نقش‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                activeTab === 'backup'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )}
            >
              <Database className="w-4 h-4" />
              <span>دیتابیس و پشتیبان</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {loadError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button size="sm" variant="secondary" onClick={triggerRefresh}>
              تلاش دوباره
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS                                      */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-2xs space-y-2">
                <span className="text-xs text-ink-500 font-bold flex items-center justify-between">
                  <span>کل محتوای زنده</span>
                  <FileText className="w-4 h-4 text-sky-600" />
                </span>
                <p className="text-2xl font-black text-ink-900 font-sans">
                  {toFaDigits(totalContentCount)}
                </p>
                <span className="text-[11px] text-ink-400 block">در ۶ درگاه تخصصی و بلاگ</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-2xs space-y-2">
                <span className="text-xs text-ink-500 font-bold flex items-center justify-between">
                  <span>طرح‌های در انتظار بررسی</span>
                  <Inbox className="w-4 h-4 text-amber-600" />
                </span>
                <p className="text-2xl font-black text-amber-700 font-sans">
                  {toFaDigits(pendingSubmissionsCount)}
                </p>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-[11px] text-amber-600 font-bold hover:underline block text-start cursor-pointer"
                >
                  مشاهده و تعیین تکلیف ←
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-2xs space-y-2">
                <span className="text-xs text-ink-500 font-bold flex items-center justify-between">
                  <span>دیدگاه‌های نیازمند تایید</span>
                  <MessageSquare className="w-4 h-4 text-pink-600" />
                </span>
                <p className="text-2xl font-black text-pink-700 font-sans">
                  {toFaDigits(pendingCommentsCount)}
                </p>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="text-[11px] text-pink-600 font-bold hover:underline block text-start cursor-pointer"
                >
                  بررسی دیدگاه‌ها ←
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-2xs space-y-2">
                <span className="text-xs text-ink-500 font-bold flex items-center justify-between">
                  <span>پیام‌های تماس جدید</span>
                  <Mail className="w-4 h-4 text-sky-600" />
                </span>
                <p className="text-2xl font-black text-sky-700 font-sans">
                  {toFaDigits(unreadMessagesCount)}
                </p>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="text-[11px] text-sky-600 font-bold hover:underline block text-start cursor-pointer"
                >
                  مشاهده صندوق پیام‌ها ←
                </button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Pending Submissions */}
              <div className="bg-white p-6 rounded-2xl border border-ink-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                  <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>آخرین ارسال‌های نیازمند داوری</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    همه ارسال‌ها
                  </button>
                </div>

                {submissions.filter((s) => s.status === 'pending').length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-400">
                    هیچ ارسالی در صف انتظار داوری نیست. همه موارد تعیین تکلیف شده‌اند.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions
                      .filter((s) => s.status === 'pending')
                      .slice(0, 3)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink-900">{sub.title}</span>
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                {sub.kind === 'idea' ? 'جرقه ایده' : 'روایت تجربه'}
                              </span>
                            </div>
                            <div className="text-ink-500 line-clamp-1 mt-0.5 prose-sm prose-ink *:!m-0">
                              {sub.summary ? sub.summary : htmlToPlainText(sub.body, 240)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setActionModalType('approve');
                              }}
                            >
                              تایید و انتشار
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Recent Unread Messages */}
              <div className="bg-white p-6 rounded-2xl border border-ink-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                  <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>پیام‌های تازه دبیرخانه</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    صندوق پیام‌ها
                  </button>
                </div>

                {messages.length === 0 && (
                  <p className="text-xs text-ink-400 py-8 text-center">
                    صندوق پیام‌ها خالی است. پیام‌های تازهٔ فرم تماس اینجا نمایش داده می‌شوند.
                  </p>
                )}

                {messages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-ink-50 border border-ink-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900">{msg.name}</span>
                        <span className="text-ink-400 font-sans">{msg.phoneOrEmail}</span>
                      </div>
                      <p className="text-ink-600 line-clamp-1 mt-0.5">
                        <strong className="text-ink-800">{msg.subject}: </strong>
                        {msg.message}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold shrink-0',
                        msg.status === 'unread'
                          ? 'bg-sky-100 text-sky-800'
                          : msg.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-ink-200 text-ink-700'
                      )}
                    >
                      {msg.status === 'unread' ? 'خوانده نشده' : msg.status === 'replied' ? 'پاسخ داده شده' : 'بررسی شده'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CONTENT HUB (FULL CRUD)                                    */}
        {/* ================================================================= */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-ink-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
                {[
                  { slug: 'all', label: 'همه بخش‌ها' },
                  { slug: 'academy', label: 'آکادمی' },
                  { slug: 'toolbox', label: 'جعبه‌ابزار' },
                  { slug: 'library', label: 'کتابخانه' },
                  { slug: 'journey', label: 'تور نوآوری' },
                  { slug: 'gathering', label: 'رویدادها' },
                  { slug: 'spark', label: 'جرقه‌ها' },
                ].map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => setContentFilterSection(s.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer',
                      contentFilterSection === s.slug
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-72">
                <div className="relative w-full">
                  <Input
                    placeholder="جستجو در عناوین..."
                    value={contentSearchQuery}
                    onChange={(e) => setContentSearchQuery(e.target.value)}
                    className="h-9 text-xs ps-8"
                  />
                  <Search className="w-3.5 h-3.5 text-ink-400 absolute start-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-ink-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-ink-50 border-b border-ink-200 text-ink-600 font-bold">
                    <tr>
                      <th className="py-3 px-4 text-start">عنوان محتوا</th>
                      <th className="py-3 px-4 text-start">بخش</th>
                      <th className="py-3 px-4 text-start">دسته‌بندی</th>
                      <th className="py-3 px-4 text-start">لایک / دیدگاه</th>
                      <th className="py-3 px-4 text-start">تاریخ انتشار</th>
                      <th className="py-3 px-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {filteredContent.map((item) => (
                      <tr key={item.id} className="hover:bg-ink-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-ink-900 line-clamp-1">{item.title}</div>
                          <span className="text-[11px] text-ink-400 font-sans">{item.slug}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-ink-100 text-ink-700 rounded font-bold text-[11px]">
                            {item.sectionSlug}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink-600">{item.category?.nameFa || 'عمومی'}</td>
                        <td className="py-3 px-4 text-ink-600 font-sans">
                          {toFaDigits(item.likeCount)} لایک • {toFaDigits(item.commentCount)} دیدگاه
                        </td>
                        <td className="py-3 px-4 text-ink-500 font-sans">
                          {formatPersianDate(item.publishedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              to={`/${item.sectionSlug}/${item.slug}`}
                              className="p-1.5 text-ink-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="مشاهده زنده در سایت"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleOpenEditContent(item)}
                              className="p-1.5 text-ink-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.id, item.title)}
                              className="p-1.5 text-ink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: SUBMISSIONS REVIEW                                        */}
        {/* ================================================================= */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-ink-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-ink-700">فیلتر وضعیت:</span>
                {[
                  { slug: 'all', label: 'همه' },
                  { slug: 'pending', label: 'در انتظار بررسی' },
                  { slug: 'needs_revision', label: 'نیازمند اصلاح' },
                  { slug: 'approved', label: 'تایید شده' },
                  { slug: 'rejected', label: 'رد شده' },
                ].map((st) => (
                  <button
                    key={st.slug}
                    onClick={() => setSubFilterStatus(st.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer',
                      subFilterStatus === st.slug
                        ? 'bg-sky-600 text-white'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white p-5 rounded-2xl border border-ink-200 shadow-2xs space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-ink-900">{sub.title}</span>
                        <span className="px-2 py-0.5 bg-ink-100 text-ink-700 font-bold rounded">
                          {sub.kind === 'idea' ? 'جرقه ایده' : 'روایت تجربه'}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded font-bold text-[10px]',
                            sub.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : sub.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'needs_revision'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-pink-100 text-pink-800'
                          )}
                        >
                          {sub.status === 'pending'
                            ? 'در انتظار بررسی'
                            : sub.status === 'approved'
                            ? 'تایید و منتشر شده'
                            : sub.status === 'needs_revision'
                            ? 'نیازمند اصلاح'
                            : 'رد شده'}
                        </span>
                      </div>
                      <div className="text-ink-400 font-sans text-[11px]">
                        ارسال‌کننده: {sub.submitterName || 'کاربر نوآفر'} • تلفن: {sub.submitterPhone || '۰۹۱۲...'} • تاریخ:{' '}
                        {formatPersianDate(sub.submittedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setActionModalType('approve');
                            }}
                            rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            تایید و انتشار
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setActionModalType('revision');
                            }}
                            rightIcon={<AlertCircle className="w-3.5 h-3.5" />}
                          >
                            ارسال اصلاحیه
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setActionModalType('reject');
                            }}
                            className="text-pink-600 hover:bg-pink-50"
                          >
                            رد
                          </Button>
                        </>
                      )}
                      {sub.publishedSlug && (
                        <Link
                          to={`/${sub.kind === 'idea' ? 'spark' : 'journey'}/${sub.publishedSlug}`}
                        >
                          <Button size="sm" variant="secondary" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                            مشاهده در سایت
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    {sub.summary && (
                      <div className="text-ink-800 font-medium leading-relaxed bg-ink-50 p-4 rounded-lg">
                        <span className="block text-xs text-ink-500 mb-1">خلاصه:</span>
                        {sub.summary}
                      </div>
                    )}
                    {sub.body && (
                      <div>
                        <span className="block text-xs text-ink-500 mb-2">متن کامل:</span>
                        <SafeHtml
                          className="text-ink-800 leading-relaxed prose prose-sm prose-ink max-w-none"
                          html={sub.body}
                        />
                      </div>
                    )}
                  </div>

                  {sub.operatorMessage && (
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900">
                      <strong>پیام ناظر: </strong>
                      {sub.operatorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: COMMENTS MODERATION                                       */}
        {/* ================================================================= */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-ink-50 border-b border-ink-200 font-bold text-xs text-ink-700">
                همه دیدگاه‌های ثبت‌شده در سایت
              </div>
              <div className="divide-y divide-ink-100">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900">{comm.author.displayName}</span>
                        <span className="text-ink-400 font-sans">{formatPersianDate(comm.createdAt)}</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded font-bold text-[10px]',
                            comm.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {comm.status === 'approved' ? 'تایید شده' : 'در انتظار بررسی'}
                        </span>
                      </div>
                      <p className="text-ink-800 leading-relaxed">{comm.body}</p>
                      <span className="text-[11px] text-sky-700 block">
                        مربوط به: {comm.contentTitle || comm.contentId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {comm.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApproveComment(comm.id)}
                          rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          تایید
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comm.id)}
                        className="text-pink-600 hover:bg-pink-50"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: CONTACT INQUIRIES                                         */}
        {/* ================================================================= */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-ink-50 border-b border-ink-200 font-bold text-xs text-ink-700">
                پیام‌ها و درخواست‌های ارسالی از فرم تماس
              </div>
              <div className="divide-y divide-ink-100">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-ink-900">{msg.name}</span>
                        <span className="text-ink-500 font-sans">{msg.phoneOrEmail}</span>
                        <span className="text-ink-400 font-sans">{formatPersianDate(msg.createdAt)}</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded font-bold text-[10px]',
                            msg.status === 'unread'
                              ? 'bg-sky-100 text-sky-800'
                              : msg.status === 'replied'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-ink-100 text-ink-700'
                          )}
                        >
                          {msg.status === 'unread'
                            ? 'خوانده نشده'
                            : msg.status === 'replied'
                            ? 'پاسخ داده شده'
                            : 'بررسی شده'}
                        </span>
                      </div>
                      <div className="font-bold text-ink-800">موضوع: {msg.subject}</div>
                      <p className="text-ink-700 leading-relaxed">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleMessageStatus(msg)}
                      >
                        {msg.status === 'unread' ? 'علامت بررسی' : msg.status === 'read' ? 'علامت پاسخ‌داده‌شده' : 'تغییر وضعیت'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-pink-600 hover:bg-pink-50"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: EVENT REGISTRATIONS                                       */}
        {/* ================================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-ink-50 border-b border-ink-200 font-bold text-xs text-ink-700 flex items-center justify-between">
                <span>لیست ثبت‌نام‌کنندگان در رویدادها و کارگاه‌های نوآفر</span>
                <span className="font-sans font-black">{toFaDigits(registrations.length)} نفر</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-ink-50 border-b border-ink-200 text-ink-600 font-bold">
                    <tr>
                      <th className="py-3 px-4 text-start">عنوان کارگاه / رویداد</th>
                      <th className="py-3 px-4 text-start">شرکت‌کننده</th>
                      <th className="py-3 px-4 text-start">شماره تماس</th>
                      <th className="py-3 px-4 text-start">کد رهگیری / بلیط</th>
                      <th className="py-3 px-4 text-start">تاریخ ثبت‌نام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-ink-50/50">
                        <td className="py-3 px-4 font-bold text-ink-900">{reg.eventTitle}</td>
                        <td className="py-3 px-4 text-ink-800">{reg.userName}</td>
                        <td className="py-3 px-4 text-ink-600 font-sans">{toFaDigits(reg.userPhone)}</td>
                        <td className="py-3 px-4 font-sans font-black text-sky-700">{reg.ticketCode}</td>
                        <td className="py-3 px-4 text-ink-500 font-sans">{formatPersianDate(reg.registeredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: USERS & ROLES & POINTS                                    */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-ink-50 border-b border-ink-200 font-bold text-xs text-ink-700">
                مدیریت کاربران، نقش‌های کاربری و امتیازات
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-ink-50 border-b border-ink-200 text-ink-600 font-bold">
                    <tr>
                      <th className="py-3 px-4 text-start">کاربر</th>
                      <th className="py-3 px-4 text-start">تلفن</th>
                      <th className="py-3 px-4 text-start">نقش</th>
                      <th className="py-3 px-4 text-start">وضعیت</th>
                      <th className="py-3 px-4 text-start">امتیاز نوآفری</th>
                      <th className="py-3 px-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-ink-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-ink-900">{u.displayName || 'کاربر'}</div>
                          <span className="text-[11px] text-ink-400">{u.bio || 'عضو شبکه نوآفر'}</span>
                        </td>
                        <td className="py-3 px-4 font-sans">{toFaDigits(u.phone)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded font-bold text-[10px]',
                              u.role === 'admin' ? 'bg-pink-100 text-pink-700' : 'bg-ink-100 text-ink-700'
                            )}
                          >
                            {u.role === 'admin' ? 'مدیر سیستم (Admin)' : 'کاربر عادی'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded font-bold text-[10px]',
                              u.isBlocked ? 'bg-pink-100 text-pink-700' : 'bg-sky-50 text-sky-700'
                            )}
                          >
                            {u.isBlocked ? 'مسدود' : 'فعال'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-amber-700">
                          {toFaDigits(u.points)} امتیاز
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedUserForPoints(u);
                              }}
                              rightIcon={<Award className="w-3.5 h-3.5 text-amber-600" />}
                            >
                              اعطای امتیاز
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleChangeUserRole(u.id, u.role || 'member')}
                            >
                              {u.role === 'admin' ? 'تنزل به کاربر' : 'ارتقا به مدیر'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleUserBlocked(u.id, Boolean(u.isBlocked))}
                              className={u.isBlocked ? 'text-sky-700' : 'text-pink-700'}
                            >
                              {u.isBlocked ? 'رفع مسدودیت' : 'مسدود کردن'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: DATABASE BACKUP & RESTORE                                 */}
        {/* ================================================================= */}
        {activeTab === "settings" && (
          <SiteSettingsManager />
        )}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Working Export Card */}
              <div className="bg-white p-6 rounded-2xl border border-ink-200 shadow-2xs space-y-4">
                <div className="w-10 h-10 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-ink-900">پشتیبان‌گیری از کل دیتابیس</h3>
                <p className="text-xs text-ink-500 leading-relaxed">
                  تمام دوره‌ها، ابزارها، کتاب‌ها، ارسال‌های کاربران، دیدگاه‌ها و پیام‌ها در قالب یک فایل استاندارد JSON ذخیره می‌شود.
                </p>
                <Button variant="primary" size="sm" onClick={handleExportDb} rightIcon={<Download className="w-4 h-4" />}>
                  دانلود فایل JSON خروجی
                </Button>
              </div>

              {/* Server Note (Non-clickable guidance) */}
              <div className="bg-ink-50/70 p-6 rounded-2xl border border-ink-200/80 space-y-4">
                <div className="flex items-center gap-2 text-ink-700 font-bold text-sm">
                  <Database className="w-4 h-4 text-ink-500" />
                  <span>راهنمای عملیات سرور و بازیابی داده‌ها</span>
                </div>
                <div className="space-y-3 text-xs text-ink-600 leading-relaxed">
                  <div className="p-3 bg-white/80 rounded-xl border border-ink-100 space-y-1">
                    <p className="font-semibold text-ink-800">بازیابی نسخه پشتیبان (Restore):</p>
                    <p className="text-ink-500">
                      جهت جلوگیری از بازنویسی اشتباه داده‌های زنده، بازیابی پایگاه‌داده PostgreSQL مستقیماً از طریق ابزار استاندارد <code className="font-sans px-1.5 py-0.5 bg-ink-100 rounded text-ink-800">pg_restore</code> در ترمینال سرور انجام می‌شود.
                    </p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-ink-100 space-y-1">
                    <p className="font-semibold text-ink-800">بارگذاری اولیه اطلاعات (Seed):</p>
                    <p className="text-ink-500">
                      برای مقداردهی یا پر کردن اولیه پایگاه داده، دستور <code className="font-sans px-1.5 py-0.5 bg-ink-100 rounded text-ink-800">npm run db:seed</code> روی سرور اجرا می‌شود.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT CONTENT                                      */}
      {/* ================================================================= */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="bg-white border-b border-ink-200 sticky top-0 z-10 px-4 py-4 flex items-center shadow-sm">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(false)}
                  className="p-2 hover:bg-ink-50 text-ink-600 rounded-full transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-ink-900">{editingContent ? 'ویرایش محتوا' : 'افزودن محتوای جدید'}</h2>
              </div>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto w-full px-4 py-8 pb-32">
            <form onSubmit={handleSaveContent} className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-800">بخش مربوطه</label>
                  <select
                    value={contentFormSection}
                    onChange={(e) => setContentFormSection(e.target.value as any)}
                    disabled={!!editingContent}
                    className="w-full h-11 px-3 bg-white border border-ink-200 rounded-lg text-ink-900 focus:outline-none focus:border-sky-600"
                  >
                    <option value="academy">آکادمی (دوره آموزشی)</option>
                    <option value="toolbox">جعبه‌ابزار (ابزار و بوم)</option>
                    <option value="library">کتابخانه (کتاب و منبع)</option>
                    <option value="journey">تور نوآوری (روایت میدانی)</option>
                    <option value="gathering">رویدادها و کارگاه‌ها</option>
                    <option value="spark">جرقه (ایده نوآورانه)</option>
                    <option value="blog">بلاگ و مقالات</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-800">دسته‌بندی موضوعی</label>
                  <select
                    value={contentFormData.categorySlug}
                    onChange={(e) => setContentFormData({ ...contentFormData, categorySlug: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-ink-200 rounded-lg text-ink-900 focus:outline-none focus:border-sky-600"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.nameFa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-800">عنوان محتوا</label>
                  <Input
                    required
                    value={contentFormData.title}
                    onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                    placeholder="مثال: کارگاه طراحی بوم اثرسنجی"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-ink-800">نامک انگلیسی (Slug)</label>
                  <Input
                    required
                    dir="ltr"
                    value={contentFormData.slug}
                    onChange={(e) => setContentFormData({ ...contentFormData, slug: e.target.value })}
                    placeholder="impact-canvas-guide"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-ink-800">خلاصه کوتاه</label>
                <RichTextEditor
                  value={contentFormData.summary}
                  onChange={(html) => setContentFormData({ ...contentFormData, summary: html })}
                  placeholder="چکیده‌ای در ۱ یا ۲ جمله برای نمایش در کارت‌ها..."
                  minHeight="120px"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-ink-800">متن کامل و شرح تفصیلی (WYSIWYG)</label>
                <RichTextEditor
                  value={contentFormData.body}
                  onChange={(html) => setContentFormData({ ...contentFormData, body: html })}
                  placeholder="متن اصلی درسنامه، راهنما، روایت یا جزئیات را بنویسید یا تصویر و جداول را درج کنید..."
                  minHeight="300px"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-ink-800">کلیدواژه‌ها (با کاما جدا کنید)</label>
                  <Input
                    value={contentFormData.tagsString}
                    onChange={(e) => setContentFormData({ ...contentFormData, tagsString: e.target.value })}
                    placeholder="نوآوری, بوم, تعاون, جامعه محلی"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <FileUpload
                    label="آپلود تصویر شاخص"
                    accept="image/*"
                    value={contentFormData.imageUrl.length > 100 ? 'تصویر آپلود شده' : null}
                    onChange={async (file) => {
                      if (!file) {
                        setContentFormData({ ...contentFormData, imageUrl: '' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setContentFormData({ ...contentFormData, imageUrl: evt.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }}
                    helperText="امکان آپلود از کامپیوتر یا وارد کردن آدرس اینترنتی (در کادر زیر)"
                  />
                  <Input
                    dir="ltr"
                    value={contentFormData.imageUrl}
                    onChange={(e) => setContentFormData({ ...contentFormData, imageUrl: e.target.value })}
                    placeholder="یا نشانی URL تصویر (مثال: /mock/image.png)"
                  />
                </div>
              </div>

              {/* Section specific fields */}
              {contentFormSection === 'academy' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-ink-50 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">مدت زمان</label>
                    <Input
                      value={contentFormData.duration}
                      onChange={(e) => setContentFormData({ ...contentFormData, duration: e.target.value })}
                      placeholder="۴ ساعت"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">سطح دوره</label>
                    <Input
                      value={contentFormData.level}
                      onChange={(e) => setContentFormData({ ...contentFormData, level: e.target.value })}
                      placeholder="مقدماتی تا پیشرفته"
                    />
                  </div>
                </div>
              )}

              {contentFormSection === 'journey' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-ink-50 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">منطقه اجرا</label>
                    <Input
                      value={contentFormData.region}
                      onChange={(e) => setContentFormData({ ...contentFormData, region: e.target.value })}
                      placeholder="سیستان و بلوچستان"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">سنجه اثر</label>
                    <Input
                      value={contentFormData.keyImpactMetric}
                      onChange={(e) => setContentFormData({ ...contentFormData, keyImpactMetric: e.target.value })}
                      placeholder="اشتغال‌زایی برای ۴۵ زن سرپرست خانوار"
                    />
                  </div>
                </div>
              )}

              {contentFormSection === 'gathering' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-ink-50 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">محل برگزاری</label>
                    <Input
                      value={contentFormData.location}
                      onChange={(e) => setContentFormData({ ...contentFormData, location: e.target.value })}
                      placeholder="آنلاین در اسکای‌روم"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-ink-800">ظرفیت کارگاه</label>
                    <Input
                      type="number"
                      value={contentFormData.capacity}
                      onChange={(e) => setContentFormData({ ...contentFormData, capacity: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-ink-100">
                <Button type="button" variant="ghost" onClick={() => setIsContentModalOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" variant="primary">
                  {editingContent ? 'ذخیره تغییرات' : 'انتشار در سایت'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: SUBMISSION ACTION (APPROVE / REVISE / REJECT)              */}
      {/* ================================================================= */}
      {selectedSubmission && actionModalType && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="bg-white border-b border-ink-200 sticky top-0 z-10 px-4 py-4 flex items-center shadow-sm">
            <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setActionModalType(null);
                  }}
                  className="p-2 hover:bg-ink-50 text-ink-600 rounded-full transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-ink-900">
                  {actionModalType === 'approve'
                    ? 'تایید و انتشار عمومی در سایت'
                    : actionModalType === 'revision'
                    ? 'ارسال پیام درخواست اصلاحیه'
                    : 'رد درخواست ارسال‌شده'}
                </h2>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full px-4 py-8 pb-32">
            <div className="space-y-6 text-sm">
              <div className="p-4 bg-ink-50 rounded-xl border border-ink-200">
                <span className="font-bold block text-ink-900 mb-2 text-lg">{selectedSubmission.title}</span>
                <p className="text-ink-700 leading-relaxed">
                  {selectedSubmission.summary || selectedSubmission.body}
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-ink-800 text-base">
                  {actionModalType === 'approve'
                    ? 'پیام تاییدیه برای کاربر (اختیاری):'
                    : actionModalType === 'revision'
                    ? 'توضیحات و موارد نیازمند بازنگری:'
                    : 'دلیل رد طرح:'}
                </label>
                <RichTextEditor
                  value={operatorNote}
                  onChange={setOperatorNote}
                  placeholder={
                    actionModalType === 'approve'
                      ? 'طرح شما تایید و منتشر شد...'
                      : actionModalType === 'revision'
                      ? 'لطفاً سنجه اثر و شیوه تامین مالی را دقیق‌تر توضیح دهید...'
                      : 'علت عدم تایید طرح...'
                  }
                  minHeight="200px"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-ink-100">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSubmission(null);
                    setActionModalType(null);
                  }}
                >
                  انصراف
                </Button>
                {actionModalType === 'approve' && (
                  <Button variant="primary" onClick={handleApproveSubmission}>
                    تایید نهایی و انتشار (+امتیاز)
                  </Button>
                )}
                {actionModalType === 'revision' && (
                  <Button variant="secondary" onClick={handleRequestRevision}>
                    ارسال پیام اصلاحیه
                  </Button>
                )}
                {actionModalType === 'reject' && (
                  <Button variant="primary" onClick={handleRejectSubmission} className="bg-pink-600 hover:bg-pink-700 border-none">
                    تایید رد طرح
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: AWARD POINTS TO USER                                       */}
      {/* ================================================================= */}
      {selectedUserForPoints && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="bg-white border-b border-ink-200 sticky top-0 z-10 px-4 py-4 flex items-center shadow-sm">
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserForPoints(null)}
                  className="p-2 hover:bg-ink-50 text-ink-600 rounded-full transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-ink-900">
                  اعطای امتیاز به {selectedUserForPoints.displayName}
                </h2>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full px-4 py-8 pb-32">
            <div className="space-y-6 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-ink-800">تعداد امتیاز</label>
                <Input
                  type="number"
                  value={pointsToAward}
                  onChange={(e) => setPointsToAward(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-ink-800">علت و عنوان تراکنش</label>
                <Input
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="پاداش مشارکت در رویداد، تسهیلگری و..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-ink-100">
                <Button variant="ghost" onClick={() => setSelectedUserForPoints(null)}>
                  انصراف
                </Button>
                <Button variant="primary" onClick={handleAwardPoints}>
                  ثبت و اعمال امتیاز
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
