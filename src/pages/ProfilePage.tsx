import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  Phone,
  Bookmark,
  FileText,
  Layout,
  History,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowLeft,
  ExternalLink,
  PlusCircle,
  Shield,
  ShieldAlert,
  RotateCw,
} from 'lucide-react';
import {
  Submission,
  SavedCanvas,
  ContentBase,
  PointTransaction,
} from '../types';
import {
  getMySubmissions,
  getMyCanvases,
  getMyBookmarks,
  getMyPointTransactions,
  deleteSavedCanvas,
  toggleBookmark as apiToggleBookmark,
  updateProfile,
} from '../services/endpoints';
import { POINT_REASONS_FA } from '../config/points';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, RichTextEditor, Tabs, Chip, EmptyState, FileUpload } from '../components/ui';
import { ResubmitModal } from '../components/profile/ResubmitModal';
import { useToast } from '../components/ui/Toast';
import { formatPersianDate, formatTimeAgo } from '../utils/date';
import { toFaDigits } from '../utils/format';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'submissions';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [canvases, setCanvases] = useState<SavedCanvas[]>([]);
  const [bookmarks, setBookmarks] = useState<ContentBase[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [, setIsLoading] = useState(true);

  // Edit profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | string | null>(user?.avatarUrl || null);
  const [nationalId, setNationalId] = useState(user?.nationalId || '');
  const [birthYear, setBirthYear] = useState(user?.birthYear || '');
  const [city, setCity] = useState(user?.city || '');
  const [interests, setInterests] = useState(user?.interests?.join('، ') || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Resubmit modal state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/profile');
      return;
    }

    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setNationalId(user.nationalId || '');
      setBirthYear(user.birthYear || '');
      setCity(user.city || '');
      setInterests(user.interests?.join('، ') || '');
      setAvatarFile(user.avatarUrl || null);
    }

    setIsLoading(true);
    Promise.all([
      getMySubmissions(),
      getMyCanvases(),
      getMyBookmarks(),
      getMyPointTransactions(),
    ])
      .then(([subs, cans, bks, txs]) => {
        setSubmissions(subs.items || (subs as unknown as Submission[]));
        setCanvases(cans);
        setBookmarks(bks.items || (bks as unknown as ContentBase[]));
        setTransactions(txs);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated, user, navigate]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const handleOpenResubmit = (sub: Submission) => {
    setSelectedSubmission(sub);
    setIsResubmitOpen(true);
  };

  const handleRefreshSubmissions = async () => {
    const updated = await getMySubmissions();
    setSubmissions(updated.items || (updated as unknown as Submission[]));
  };

  const handleDeleteCanvas = async (id: string) => {
    await deleteSavedCanvas(id);
    setCanvases((prev) => prev.filter((c) => c.id !== id));
    showToast('بوم با موفقیت حذف شد.', 'info');
  };

  const handleRemoveBookmark = async (item: ContentBase) => {
    await apiToggleBookmark(item.id);
    setBookmarks((prev) => prev.filter((b) => b.id !== item.id));
    showToast('مطلب از نشان‌ها حذف شد.', 'info');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      let finalAvatarUrl = typeof avatarFile === 'string' ? avatarFile : undefined;
      
      if (avatarFile instanceof File) {
        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      } else if (avatarFile === null) {
        finalAvatarUrl = ''; // Clear avatar
      }

      await updateProfile({ 
        displayName, 
        bio, 
        avatarUrl: finalAvatarUrl,
        nationalId,
        birthYear,
        city,
        interests: interests.split('،').map(i => i.trim()).filter(Boolean)
      });
      if (refreshProfile) await refreshProfile();
      showToast('اطلاعات حساب کاربری با موفقیت به‌روزرسانی شد.', 'success');
    } catch {
      showToast('خطا در به‌روزرسانی اطلاعات.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!user) return null;

  const tabs = [
    {
      id: 'submissions',
      label: `ارسال‌های من (${toFaDigits(submissions.length)})`,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'canvases',
      label: `بوم‌های ذخیره‌شده (${toFaDigits(canvases.length)})`,
      icon: <Layout className="w-4 h-4" />,
    },
    {
      id: 'bookmarks',
      label: `نشان‌ها (${toFaDigits(bookmarks.length)})`,
      icon: <Bookmark className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'تاریخچه امتیازات',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'edit',
      label: 'ویرایش پروفایل',
      icon: <Edit3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* User Identity Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-ink-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
              <div className="w-20 h-20 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white ring-4 ring-sky-50">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || 'کاربر'}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  (user.displayName || 'ک').charAt(0)
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-ink-900">
                    {user.displayName || 'کاربر نوآفر'}
                  </h1>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    user.role === 'admin'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : user.role === 'operator'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {user.role === 'admin' ? 'مدیر ارشد سامانه' : user.role === 'operator' ? 'اپراتور و ناظر' : 'کنشگر نوآوری اجتماعی'}
                  </span>

                  {(user.role === 'admin' || user.role === 'operator') && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-100/90 hover:bg-sky-200/90 rounded-lg transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>ورود به پنل مدیریت</span>
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink-500 font-sans">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-ink-400" />
                    <span dir="ltr">{toFaDigits(user.phone)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-ink-600">
                    <Calendar className="w-3.5 h-3.5 text-ink-400" />
                    <span>کسوت نوآفری: ۱۹۴ روز همراهی</span>
                  </span>
                </div>

                {user.bio && (
                  <p className="text-xs text-ink-600 max-w-md pt-1 leading-relaxed">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Total Points Score Box */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 rounded-xl border border-amber-200 text-center sm:text-end space-y-1 shrink-0 w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-end gap-1 text-amber-900 text-xs font-bold">
                <Award className="w-4 h-4 text-amber-600" />
                <span>مجموع امتیازات نوآفری</span>
              </div>
              <div className="text-3xl font-black text-amber-900 font-sans">
                {toFaDigits(user.points)}
              </div>
              <span className="text-[11px] text-amber-700 block">
                سطح: پیشگام نوآوری
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-ink-200 p-2 shadow-2xs">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant="pills"
          />
        </div>

        {/* Tab Contents */}
        {/* 1. Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-900">
                وضعیت ایده‌ها و تجربیات ارسالی شما
              </h3>
              <div className="flex gap-2">
                <Link to="/spark/submit">
                  <Button size="sm" variant="accent" rightIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    ثبت ایده نو
                  </Button>
                </Link>
                <Link to="/journey/submit">
                  <Button size="sm" variant="primary" rightIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    ثبت تجربه
                  </Button>
                </Link>
              </div>
            </div>

            {submissions.length === 0 ? (
              <EmptyState
                title="هنوز مطلبی ارسال نکرده‌اید"
                description="می‌توانید با ثبت ایده در درگاه جرقه یا روایت تجربه در درگاه سفر، امتیاز کسب کنید."
              />
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-xl border border-ink-200 p-5 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          variant={sub.sectionSlug === 'spark' || sub.kind === 'idea' ? 'amber' : 'sky'}
                        >
                          {sub.sectionSlug === 'spark' || sub.kind === 'idea' ? 'ایده نو' : 'روایت تجربه'}
                        </Chip>
                        <h4 className="text-base font-bold text-ink-900">
                          {sub.title}
                        </h4>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {sub.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                            <span>تایید و منتشر شده (+{sub.kind === 'idea' ? '۵۰' : '۱۰۰'} امتیاز)</span>
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-ink-100 text-ink-700 border border-ink-200">
                            <Clock className="w-3.5 h-3.5 text-ink-500" />
                            <span>در حال داوری و بررسی</span>
                          </span>
                        )}
                        {sub.status === 'needs_revision' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>نیازمند ویرایش و اصلاح</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {sub.summary && (
                      <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                        {sub.summary}
                      </p>
                    )}

                    {/* Operator Message Box for Needs Revision */}
                    {sub.status === 'needs_revision' && sub.operatorMessage && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>پیام داور نوآفر:</span>
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed ps-5">
                          {sub.operatorMessage}
                        </p>
                        <div className="pt-1 ps-5">
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => handleOpenResubmit(sub)}
                          >
                            ویرایش و ارسال مجدد
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-ink-100 text-xs text-ink-400 font-sans">
                      <span>تاریخ ارسال: {formatPersianDate(sub.submittedAt || sub.createdAt || '')}</span>
                      {sub.status === 'approved' && sub.publishedSlug && (
                        <Link
                          to={`/${sub.kind === 'idea' ? 'spark' : 'journey'}/${sub.publishedSlug}`}
                          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold font-dana"
                        >
                          <span>مشاهده در سایت</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Canvases Tab */}
        {activeTab === 'canvases' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-ink-900">
              بوم‌های تعاملی ذخیره‌شده شما در نوآفر
            </h3>

            {canvases.length === 0 ? (
              <EmptyState
                title="هنوز بومی ایجاد یا ذخیره نکرده‌اید"
                description="به جعبه‌ابزار مراجعه کنید و بوم مورد نظر خود را به صورت آنلاین تکمیل نمایید."
                action={
                  <Link to="/toolbox">
                    <Button variant="primary">مشاهده جعبه‌ابزار نوآفر</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {canvases.map((can) => (
                  <div
                    key={can.id}
                    className="bg-white p-5 rounded-xl border border-ink-200 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] px-2 py-0.5 bg-pink-50 text-pink-700 rounded-md font-bold">
                          بوم تعاملی
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCanvas(can.id)}
                          className="text-ink-400 hover:text-pink-600 p-1"
                          aria-label="حذف بوم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-ink-900">
                        {can.title || can.toolTitle}
                      </h4>

                      <p className="text-xs text-ink-400 font-sans">
                        آخرین تغییر: {formatTimeAgo(can.updatedAt)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-ink-100 flex justify-end">
                      <Link to={`/toolbox/${can.toolSlug || can.toolId}/canvas`}>
                        <Button size="sm" variant="secondary" rightIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                          ادامه تکمیل بوم
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-ink-900">
              مطالب و دوره‌های ذخیره‌شده شما
            </h3>

            {bookmarks.length === 0 ? (
              <EmptyState
                title="هیچ مطلبی را نشان نکرده‌اید"
                description="با کلیک روی آیکون نشان در هر محتوا، آن را برای مطالعه بعدی در اینجا ذخیره کنید."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="bg-white p-4 rounded-xl border border-ink-200 shadow-2xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="neutral">
                          {bm.sectionSlug}
                        </Chip>
                      </div>
                      <Link
                        to={`/${bm.sectionSlug}/${bm.slug}`}
                        className="text-sm font-bold text-ink-900 hover:text-sky-600 block line-clamp-1"
                      >
                        {bm.title}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(bm)}
                      className="p-2 text-ink-400 hover:text-pink-600 shrink-0"
                      aria-label="حذف از نشان‌ها"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-ink-200 p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-ink-900">
              ریز تراکنش‌های امتیازات نوآفری
            </h3>

            <div className="divide-y divide-ink-100">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink-900">
                      {tx.reasonFa || POINT_REASONS_FA[tx.reason]?.label || tx.reason}
                    </p>
                    <p className="text-ink-400 font-sans">
                      {formatPersianDate(tx.createdAt)}
                    </p>
                  </div>

                  <span className="font-bold text-sm text-amber-800 font-sans bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    +{toFaDigits(tx.points)} امتیاز
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Edit Profile Tab */}
        {activeTab === 'edit' && (
          <div className="bg-white rounded-xl border border-ink-200 p-6 max-w-xl space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-ink-900">
              ویرایش مشخصات حساب کاربری
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <FileUpload
                label="تصویر پروفایل (آواتار)"
                accept="image/*"
                value={avatarFile}
                onChange={setAvatarFile}
                helperText="حداکثر حجم پیشنهادی: ۲ مگابایت (فرمت‌های JPG, PNG)"
              />
              <Input
                label="نام و نام خانوادگی"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <Input
                label="شماره موبایل"
                value={toFaDigits(user.phone)}
                disabled
                helperText="شماره موبایل هویت اصلی شماست و قابل تغییر نیست."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="کد ملی (اختیاری)"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  dir="ltr"
                  helperText="جهت صدور گواهینامه‌های پایان‌دوره"
                />
                <Input
                  label="سال تولد"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  dir="ltr"
                  placeholder="مثال: 1375"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="استان / شهر سکونت"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: تهران"
                />
                <Input
                  label="علاقه‌مندی‌ها (با کاما یا ویرگول جدا کنید)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="محیط زیست، آموزش، نوآوری"
                />
              </div>


              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">درباره من / بیوگرافی کوتاه</label>
                <RichTextEditor
                  value={bio}
                  onChange={setBio}
                  placeholder="حوزه‌های مورد علاقه در نوآوری اجتماعی..."
                  minHeight="140px"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingProfile}
                >
                  ذخیره تغییرات
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ResubmitModal
        submission={selectedSubmission}
        isOpen={isResubmitOpen}
        onClose={() => setIsResubmitOpen(false)}
        onSuccess={handleRefreshSubmissions}
      />
    </div>
  );
};
